"use server";

/**
 * Admin Inventory Server Actions — Phase 5.1 / Issue #62.
 *
 * Reads run via the user-scoped Supabase client (RLS lets admins
 * through). Writes go via SECURITY DEFINER RPC (restock_book) or
 * direct admin-gated table updates with audit log entries.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  LOW_STOCK_THRESHOLD,
  type InventoryFilter,
  type InventoryRow,
} from "@/lib/inventory/constants";
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

export async function listBooksForInventory(
  filter: InventoryFilter,
): Promise<ActionResult<{ rows: InventoryRow[]; counts: Record<InventoryFilter, number> }>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  let query = supabase
    .from("books")
    .select(
      "id, slug, title, subtitle, curriculum, cover_image_url, price_paise, inventory_count, is_active",
    )
    .order("title", { ascending: true });

  if (filter === "low") {
    query = query.gt("inventory_count", 0).lt("inventory_count", LOW_STOCK_THRESHOLD);
  } else if (filter === "out") {
    query = query.eq("inventory_count", 0);
  } else if (filter === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: rows, error } = await query;
  if (error) return { success: false, error: error.message };

  // Tab badge counts — fetch in parallel, head-only for speed.
  const base = supabase.from("books");
  const [all, low, out, inactive] = await Promise.all([
    base.select("*", { count: "exact", head: true }),
    base
      .select("*", { count: "exact", head: true })
      .gt("inventory_count", 0)
      .lt("inventory_count", LOW_STOCK_THRESHOLD),
    base.select("*", { count: "exact", head: true }).eq("inventory_count", 0),
    base.select("*", { count: "exact", head: true }).eq("is_active", false),
  ]);

  return {
    success: true,
    data: {
      rows: (rows ?? []) as InventoryRow[],
      counts: {
        all: all.count ?? 0,
        low: low.count ?? 0,
        out: out.count ?? 0,
        inactive: inactive.count ?? 0,
      },
    },
  };
}

/* ============================================================
 * updateBookStock — absolute count via restock_book RPC.
 * ============================================================ */
const stockInput = z.object({
  bookId: z.string().uuid(),
  newCount: z.number().int().min(0).max(100000),
  reason: z.string().trim().max(200).optional(),
});

export async function updateBookStock(
  input: z.input<typeof stockInput>,
): Promise<ActionResult<{ id: string; inventory_count: number }>> {
  const parsed = stockInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "restock_book" as never,
    {
      p_book_id: parsed.data.bookId,
      p_new_count: parsed.data.newCount,
      p_reason: parsed.data.reason ?? null,
    } as never,
  );
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  revalidatePath("/ibdp");
  revalidatePath("/igcse");

  const row = (data as unknown as { id: string; inventory_count: number } | null) ?? null;
  return {
    success: true,
    data: { id: row?.id ?? parsed.data.bookId, inventory_count: row?.inventory_count ?? parsed.data.newCount },
  };
}

/* ============================================================
 * updateBookActive — flip is_active.
 * ============================================================ */
const activeInput = z.object({
  bookId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function updateBookActive(
  input: z.input<typeof activeInput>,
): Promise<ActionResult> {
  const parsed = activeInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service
    .from("books")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.bookId);
  if (error) return { success: false, error: error.message };

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.set_active",
    target_table: "books",
    target_id: parsed.data.bookId,
    details: { is_active: parsed.data.isActive },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  return { success: true };
}

/* ============================================================
 * updateBookPrice — rupees in / paise stored.
 * ============================================================ */
const priceInput = z.object({
  bookId: z.string().uuid(),
  pricePaise: z.number().int().min(0).max(100000 * 100),
});

export async function updateBookPrice(
  input: z.input<typeof priceInput>,
): Promise<ActionResult> {
  const parsed = priceInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: existing } = await service
    .from("books")
    .select("price_paise")
    .eq("id", parsed.data.bookId)
    .maybeSingle();
  const oldPrice = existing?.price_paise ?? null;

  const { error } = await service
    .from("books")
    .update({ price_paise: parsed.data.pricePaise })
    .eq("id", parsed.data.bookId);
  if (error) return { success: false, error: error.message };

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "book.set_price",
    target_table: "books",
    target_id: parsed.data.bookId,
    details: { old_price_paise: oldPrice, new_price_paise: parsed.data.pricePaise },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/store");
  return { success: true };
}
