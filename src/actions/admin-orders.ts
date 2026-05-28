"use server";

/**
 * Admin Orders Server Actions — Phase 5.1.
 *
 * Read paths run through the user-scoped Supabase client; RLS lets
 * admin emails through via `orders_admin_all`. Write paths go through
 * SECURITY DEFINER RPCs (`update_order_status`, `set_order_tracking`)
 * which re-check `is_admin()` server-side and write an
 * admin_audit_logs row on every mutation.
 *
 * Returns follow CLAUDE.md §4: discriminated union, no throws on
 * user-facing paths.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  COURIER_VALUES,
  ORDER_STATUS_VALUES,
  type OrderStatusV2,
} from "@/lib/orders/labels";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

/* ============================================================
 * Auth guard — used by every mutation action.
 * ============================================================ */
async function assertAdmin(): Promise<
  | { ok: true; email: string }
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
  if (!isAdminEmail(user.email)) {
    return { ok: false, error: "Not authorised." };
  }
  return { ok: true, email: user.email };
}

/* ============================================================
 * listOrders — paginated list with status / search / date filters.
 * ============================================================ */
const listInput = z.object({
  status: z.enum(ORDER_STATUS_VALUES).optional(),
  search: z.string().trim().max(120).optional(),
  from: z.string().optional(), // ISO date (YYYY-MM-DD)
  to: z.string().optional(),
  page: z.number().int().min(1).max(500).optional(),
});

export interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatusV2;
  total_paise: number;
  shipping_pincode: string | null;
  shipping_city: string | null;
  customer_name: string | null;
  customer_email: string | null;
  created_at: string;
  paid_at: string | null;
}

const PAGE_SIZE = 25;

export async function listOrders(input: z.input<typeof listInput>): Promise<
  ActionResult<{ rows: OrderRow[]; page: number; pageSize: number; total: number }>
> {
  const parsed = listInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid filters" };
  }

  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const { status, search, from, to, page = 1 } = parsed.data;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      `id, order_number, status, total_paise, shipping_pincode, shipping_address,
       created_at, paid_at,
       user:users!inner(email, full_name)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (status) {
    // Cast covers values added by migration 20260528175144 not yet in
    // the generated enum.
    query = query.eq("status", status as unknown as Tables<"orders">["status"]);
  } else {
    // "All" tab — hide abandoned checkouts (pending_payment rows that
    // never got a successful Razorpay capture). These accumulate every
    // time someone opens the modal and closes it without paying. They
    // still exist in the DB and remain accessible via
    // /admin/orders?status=pending_payment for cleanup, but they
    // shouldn't drown out real orders Mom needs to pack.
    query = query.neq("status", "pending_payment" as unknown as Tables<"orders">["status"]);
  }
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59Z`);
  if (search && search.length > 0) {
    const trimmed = search.replace(/'/g, "");
    // Search across order_number + customer email (foreign-table OR is
    // a Postgres-side `or()`; we emulate with two queries combined client
    // side if needed. For v1, narrow to order_number prefix.).
    query = query.ilike("order_number", `%${trimmed}%`);
  }

  const fromIdx = (page - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;
  query = query.range(fromIdx, toIdx);

  const { data, error, count } = await query;
  if (error) {
    return { success: false, error: error.message };
  }

  const rows: OrderRow[] = (data ?? []).map((row) => {
    // `user` comes back as an object (we used inner join). Type narrowing
    // for the Supabase relational select result.
    const user = (row as unknown as { user: { email: string | null; full_name: string | null } })
      .user;
    const addr = (row.shipping_address ?? null) as { city?: string | null } | null;
    return {
      id: row.id,
      order_number: row.order_number,
      status: row.status as OrderStatusV2,
      total_paise: row.total_paise,
      shipping_pincode: row.shipping_pincode,
      shipping_city: addr?.city ?? null,
      customer_name: user?.full_name ?? null,
      customer_email: user?.email ?? null,
      created_at: row.created_at,
      paid_at: row.paid_at,
    };
  });

  return {
    success: true,
    data: { rows, page, pageSize: PAGE_SIZE, total: count ?? rows.length },
  };
}

/* ============================================================
 * getOrderDetail — single order + items + customer.
 * ============================================================ */
export interface OrderDetail {
  order: Omit<Tables<"orders">, "status"> & { status: OrderStatusV2 };
  items: Array<
    Tables<"order_items"> & {
      book: Pick<Tables<"books">, "id" | "title" | "subtitle" | "cover_image_url" | "slug"> | null;
    }
  >;
  customer: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
}

export async function getOrderDetail(orderId: string): Promise<ActionResult<OrderDetail>> {
  if (!z.string().uuid().safeParse(orderId).success) {
    return { success: false, error: "Invalid order id." };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) {
    return { success: false, error: orderErr?.message ?? "Order not found." };
  }

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select(
      `*, book:books(id, title, subtitle, cover_image_url, slug)`,
    )
    .eq("order_id", orderId);
  if (itemsErr) {
    return { success: false, error: itemsErr.message };
  }

  const { data: customer } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("id", order.user_id)
    .maybeSingle();

  return {
    success: true,
    data: {
      order: { ...order, status: order.status as OrderStatusV2 },
      items: (items ?? []) as OrderDetail["items"],
      customer: customer ?? null,
    },
  };
}

/* ============================================================
 * updateOrderStatus — flip via SECURITY DEFINER RPC.
 * ============================================================ */
const updateStatusInput = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum(ORDER_STATUS_VALUES),
  notes: z.string().trim().max(500).optional(),
});

export async function updateOrderStatus(
  input: z.input<typeof updateStatusInput>,
): Promise<ActionResult<{ id: string; status: OrderStatusV2 }>> {
  const parsed = updateStatusInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  // RPC is SECURITY DEFINER; re-checks is_admin() server-side.
  const { data, error } = await supabase.rpc(
    // RPC name not yet in generated types (migration pending).
    "update_order_status" as never,
    {
      p_order_id: parsed.data.orderId,
      p_new_status: parsed.data.newStatus,
      p_notes: parsed.data.notes ?? null,
    } as never,
  );
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);

  const row = (data as unknown as { id: string; status: OrderStatusV2 } | null) ?? null;
  return {
    success: true,
    data: { id: row?.id ?? parsed.data.orderId, status: row?.status ?? parsed.data.newStatus },
  };
}

/* ============================================================
 * setTracking — capture Shiprocket tracking number + courier.
 * ============================================================ */
const trackingInput = z.object({
  orderId: z.string().uuid(),
  trackingNumber: z.string().trim().min(1).max(120),
  courierName: z.enum(COURIER_VALUES),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), {
      message: "Tracking URL must start with http(s)://",
    }),
});

export async function setOrderTracking(
  input: z.input<typeof trackingInput>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = trackingInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "set_order_tracking" as never,
    {
      p_order_id: parsed.data.orderId,
      p_tracking_number: parsed.data.trackingNumber,
      p_courier_name: parsed.data.courierName,
      p_tracking_url: parsed.data.trackingUrl ?? null,
    } as never,
  );
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { success: true, data: { id: parsed.data.orderId } };
}

/* ============================================================
 * Status counts — for the admin tab badges.
 * ============================================================ */
export type StatusCounts = Record<OrderStatusV2 | "all", number>;

export async function getOrderStatusCounts(): Promise<ActionResult<StatusCounts>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  // Single round-trip parallel fetch — cheap on small data, keeps logic linear.
  const statuses: OrderStatusV2[] = [
    "pending_payment",
    "paid",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
    "on_hold",
    "partially_refunded",
  ];

  const [all, ...perStatus] = await Promise.all([
    // "All" count mirrors the list query: exclude pending_payment so
    // abandoned-checkout rows don't inflate the badge.
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .neq("status", "pending_payment" as unknown as Tables<"orders">["status"]),
    ...statuses.map((s) =>
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", s as unknown as Tables<"orders">["status"]),
    ),
  ]);

  const counts = { all: all.count ?? 0 } as StatusCounts;
  statuses.forEach((s, i) => {
    counts[s] = perStatus[i].count ?? 0;
  });
  return { success: true, data: counts };
}

