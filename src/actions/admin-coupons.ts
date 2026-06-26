"use server";

/**
 * Admin Coupon Management — Phase 5.2 / Issue #64.
 *
 * Built-in globals (student10, teacher10) are seeded via
 * migrations and shown read-only. Vendor codes are minted here:
 *
 *   1. Mom enters: discount %, vendor name, optional expiry, optional
 *      multi-use count.
 *   2. We mint a random VND-XXXX-XXXX code and insert it with
 *      created_by = Mom, max_uses = 1 (single-use) or N (multi-use).
 *   3. Mom shares the code with the vendor. Customer redemption goes
 *      through the same preview_coupon + redeem_coupon RPCs already
 *      in use for global codes.
 *
 * Vendor vs built-in is determined by created_by IS NULL (built-in)
 * vs IS NOT NULL (Mom-created).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { generateVendorCode } from "@/lib/coupons/generate";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export interface CouponRow {
  id: string;
  code: string;
  type: "global" | "single_use";
  discount_percent: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

async function assertAdmin(): Promise<
  | { ok: true; email: string; id: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) {
    return { ok: false, error: "Not signed in." };
  }
  if (!(await isAdminEmail(user.email))) {
    return { ok: false, error: "Not authorised." };
  }
  return { ok: true, email: user.email, id: user.id };
}

/* ============================================================
 * Reads
 * ============================================================ */
export async function listGlobalCoupons(): Promise<ActionResult<CouponRow[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, code, type, discount_percent, max_uses, uses_count, expires_at, notes, created_at, created_by",
    )
    .is("created_by", null)
    .order("created_at", { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as CouponRow[] };
}

export async function listVendorCoupons(): Promise<ActionResult<CouponRow[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, code, type, discount_percent, max_uses, uses_count, expires_at, notes, created_at, created_by",
    )
    .not("created_by", "is", null)
    .order("created_at", { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as CouponRow[] };
}

/* ============================================================
 * generateVendorCoupon — mints a new VND-XXXX-XXXX code.
 * ============================================================ */
const generateInput = z.object({
  discountPercent: z.number().int().min(1).max(100),
  vendorName: z.string().trim().min(1).max(120),
  expiresAt: z.string().optional().or(z.literal("")),
  maxUses: z.number().int().min(1).max(10000),
  // Optional: restrict the code to a single book (clearance). Discount then
  // applies only to that book's line items at checkout.
  bookId: z.string().uuid().optional().or(z.literal("")),
});

export async function generateVendorCoupon(
  input: z.input<typeof generateInput>,
): Promise<ActionResult<{ code: string }>> {
  const parsed = generateInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const { discountPercent, vendorName, expiresAt, maxUses, bookId } = parsed.data;
  const service = createServiceClient();

  // Retry up to 5 times in the (vanishingly unlikely) case of a
  // collision against an existing code.
  let lastErr: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateVendorCode();
    const { error } = await service.from("coupons").insert({
      code,
      // Type rules: single_use requires max_uses=1 (DB CHECK). Multi-use
      // is type='global' with whatever max_uses Mom picked.
      type: maxUses === 1 ? "single_use" : "global",
      discount_percent: discountPercent,
      max_uses: maxUses,
      created_by: gate.id,
      notes: vendorName,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      book_id: bookId || null,
    });
    if (!error) {
      revalidatePath("/admin/coupons");
      return { success: true, data: { code } };
    }
    if (error.code === "23505") {
      lastErr = "Code collision — retrying.";
      continue;
    }
    return { success: false, error: error.message };
  }
  return { success: false, error: lastErr ?? "Could not generate a unique code. Try again." };
}

/* ============================================================
 * deleteCoupon — only vendor codes that haven't been used.
 * ============================================================ */
const deleteInput = z.object({ code: z.string().min(1) });

export async function deleteCoupon(
  input: z.input<typeof deleteInput>,
): Promise<ActionResult> {
  const parsed = deleteInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  // Safety: refuse to delete built-in (created_by IS NULL) OR codes
  // that have been used (we want the audit trail intact).
  const { data: existing } = await service
    .from("coupons")
    .select("id, created_by, uses_count")
    .eq("code", parsed.data.code)
    .maybeSingle();
  if (!existing) {
    return { success: false, error: "Code not found." };
  }
  if (existing.created_by === null) {
    return {
      success: false,
      error: "Built-in codes can't be deleted from the UI.",
    };
  }
  if (existing.uses_count > 0) {
    return {
      success: false,
      error: "Code already used — can't delete (keeps the audit trail intact).",
    };
  }

  const { error } = await service.from("coupons").delete().eq("id", existing.id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/coupons");
  return { success: true };
}
