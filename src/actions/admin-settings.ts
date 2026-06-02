"use server";

/**
 * Admin Settings Server Actions — Phase 5.5.
 *
 * Mutations for the four sections rendered at /admin/settings:
 *   - Seller details   (invoice header)
 *   - Shipping settings (free-shipping toggle + threshold + pickup pincode)
 *   - Bank details      (invoice footer)
 *   - Admin emails      (allowlist CRUD)
 *
 * Reads live in src/lib/settings/queries.ts (typed, cached, falls back
 * to hardcoded defaults). Writes here update the canonical
 * public.settings row OR public.admin_emails table.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

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

async function upsertSetting(key: string, value: unknown): Promise<void> {
  const service = createServiceClient();
  await service
    .from("settings")
    .upsert({ key, value: value as never });
}

/* ============================================================
 * Seller details
 * ============================================================ */
const sellerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  addressLines: z
    .array(z.string().trim().max(160))
    .min(1)
    .max(5),
  phone: z.string().trim().min(4).max(30),
  email: z.string().email(),
  gstin: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function updateSellerDetails(
  input: z.input<typeof sellerSchema>,
): Promise<ActionResult> {
  const parsed = sellerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const data = parsed.data;
  await upsertSetting("seller_details", {
    name: data.name,
    address_lines: data.addressLines.filter(Boolean),
    phone: data.phone,
    email: data.email,
    gstin: data.gstin || null,
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

/* ============================================================
 * Shipping settings
 * ============================================================ */
const shippingSchema = z.object({
  freeShippingEnabled: z.boolean(),
  freeShippingThresholdPaise: z
    .number()
    .int()
    .min(0)
    .max(1_00_00_00), // ₹1 lakh sanity cap
  pickupPincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Pickup pincode must be 6 digits")
    .optional()
    .or(z.literal("")),
  pickupLocation: z.string().trim().min(1).max(80),
});

export async function updateShippingSettings(
  input: z.input<typeof shippingSchema>,
): Promise<ActionResult> {
  const parsed = shippingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const data = parsed.data;
  await upsertSetting("shipping_settings", {
    free_shipping_enabled: data.freeShippingEnabled,
    free_shipping_threshold_paise: data.freeShippingThresholdPaise,
    pickup_pincode: data.pickupPincode || null,
    pickup_location: data.pickupLocation,
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

/* ============================================================
 * Checkout safety
 * ============================================================ */
const checkoutSafetySchema = z.object({
  minPayableFraction: z.number().min(0).max(1),
});

export async function updateCheckoutSafety(
  input: z.input<typeof checkoutSafetySchema>,
): Promise<ActionResult> {
  const parsed = checkoutSafetySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  await upsertSetting("checkout_safety", {
    min_payable_fraction: parsed.data.minPayableFraction,
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

/* ============================================================
 * Bank details
 * ============================================================ */
const bankSchema = z.object({
  name: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(5).max(30),
  ifsc: z.string().trim().min(8).max(20),
  branch: z.string().trim().min(2).max(120),
});

export async function updateBankDetails(
  input: z.input<typeof bankSchema>,
): Promise<ActionResult> {
  const parsed = bankSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const data = parsed.data;
  await upsertSetting("bank_details", {
    name: data.name,
    account_number: data.accountNumber,
    ifsc: data.ifsc,
    branch: data.branch,
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

/* ============================================================
 * Admin emails
 * ============================================================ */
const addAdminSchema = z.object({
  email: z.string().email(),
  notes: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function listAdminEmails(): Promise<
  ActionResult<Array<{ email: string; added_at: string; notes: string | null }>>
> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_emails")
    .select("email, added_at, notes")
    .order("added_at", { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function addAdminEmail(
  input: z.input<typeof addAdminSchema>,
): Promise<ActionResult> {
  const parsed = addAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service.from("admin_emails").insert({
    email: parsed.data.email.toLowerCase(),
    added_by: gate.id,
    notes: parsed.data.notes || null,
  });
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That email is already an admin." };
    }
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/settings");
  return { success: true };
}

const removeAdminSchema = z.object({ email: z.string().email() });

export async function removeAdminEmail(
  input: z.input<typeof removeAdminSchema>,
): Promise<ActionResult> {
  const parsed = removeAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  // Safety rail: don't let an admin remove themselves and lock the
  // whole org out.
  if (parsed.data.email.toLowerCase() === gate.email.toLowerCase()) {
    return {
      success: false,
      error: "You can't remove your own admin access here.",
    };
  }

  const service = createServiceClient();
  const { error } = await service
    .from("admin_emails")
    .delete()
    .eq("email", parsed.data.email.toLowerCase());
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}
