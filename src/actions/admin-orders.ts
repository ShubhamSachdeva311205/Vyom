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
import {
  ShiprocketError,
  assignAwb,
  createOrder as createShiprocketOrder,
} from "@/lib/shiprocket/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { countAbandonedOrders, sweepAbandonedOrders } from "@/lib/orders/abandoned";
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
  if (!(await isAdminEmail(user.email))) {
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
  // Accept either a UUID (id) or a human order_number (ADV-YYYYMMDD-XXXXX).
  const isUuid = z.string().uuid().safeParse(orderId).success;
  const ORDER_NUMBER_REGEX = /^[A-Z0-9-]{4,40}$/;
  if (!isUuid && !ORDER_NUMBER_REGEX.test(orderId)) {
    return { success: false, error: "Invalid order id." };
  }

  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();

  const baseQuery = supabase.from("orders").select("*");
  const { data: order, error: orderErr } = await (isUuid
    ? baseQuery.eq("id", orderId)
    : baseQuery.eq("order_number", orderId)
  ).maybeSingle();
  if (orderErr || !order) {
    return { success: false, error: orderErr?.message ?? "Order not found." };
  }

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select(
      `*, book:books(id, title, subtitle, cover_image_url, slug)`,
    )
    .eq("order_id", order.id);
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

  // Side-effect: when Mom marks an order as Packed and it doesn't yet
  // have a Shiprocket AWB, auto-create the Shiprocket order + assign
  // an AWB. Best-effort — if Shiprocket is down, the status flip
  // still succeeds and Mom can fall back to creating the shipment in
  // the Shiprocket panel by hand. Errors are logged, not surfaced.
  if (parsed.data.newStatus === "packed") {
    void autoCreateShiprocketOrder(parsed.data.orderId).catch((err) => {
      console.error("[admin-orders] Shiprocket auto-create failed:", err);
    });
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
 * Shiprocket auto-create on Mark-as-Packed.
 *
 * Runs out-of-band (best-effort): looks up the order + items + customer,
 * builds the Shiprocket payload, creates the order, assigns an AWB if
 * one wasn't auto-picked, then patches our orders row with the AWB +
 * courier. If anything fails, logs and returns — Mom can hit the
 * tracking form manually as a fallback.
 * ============================================================ */
async function autoCreateShiprocketOrder(orderId: string): Promise<void> {
  const service = createServiceClient();

  // Bail if this order already has a tracking number (idempotent: don't
  // create a second Shiprocket order if Mom flips packed → shipped → packed).
  const { data: existing } = await service
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!existing) {
    console.warn("[admin-orders] Shiprocket auto-create skipped — order not found:", orderId);
    return;
  }
  const existingAwb = (existing as unknown as { tracking_number: string | null })
    .tracking_number;
  if (existingAwb) {
    console.info("[admin-orders] Shiprocket auto-create skipped — already has AWB:", existingAwb);
    return;
  }

  // Pull line items + book titles.
  const { data: items } = await service
    .from("order_items")
    .select("*, book:books(id, title, slug, weight_grams, length_cm, breadth_cm, height_cm)")
    .eq("order_id", orderId);
  if (!items || items.length === 0) {
    console.warn("[admin-orders] Shiprocket auto-create skipped — order has no items:", orderId);
    return;
  }

  // Customer email/phone for billing contact.
  const { data: customer } = await service
    .from("users")
    .select("email, full_name")
    .eq("id", existing.user_id)
    .maybeSingle();

  type ShipAddress = {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    country?: string | null;
    phone?: string | null;
  };
  const addr = (existing.shipping_address ?? null) as ShipAddress | null;
  if (!addr || !addr.line1 || !addr.city || !addr.pincode || !addr.phone) {
    console.warn(
      "[admin-orders] Shiprocket auto-create skipped — incomplete shipping address.",
      {
        orderId,
        hasAddress: Boolean(addr),
        hasLine1: Boolean(addr?.line1),
        hasCity: Boolean(addr?.city),
        hasPincode: Boolean(addr?.pincode),
        hasPhone: Boolean(addr?.phone),
      },
    );
    return;
  }

  // Sum total parcel weight + use the largest book dim for the parcel.
  let totalWeight = 0;
  let maxLength = 22;
  let maxBreadth = 15;
  let maxHeight = 2;
  const shipItems = items.map((it) => {
    type B = {
      weight_grams?: number;
      length_cm?: number;
      breadth_cm?: number;
      height_cm?: number;
      title?: string;
      slug?: string;
    };
    const book = (it.book ?? {}) as B;
    const w = book.weight_grams ?? 300;
    totalWeight += w * it.quantity;
    maxLength = Math.max(maxLength, Number(book.length_cm ?? maxLength));
    maxBreadth = Math.max(maxBreadth, Number(book.breadth_cm ?? maxBreadth));
    maxHeight = Math.max(maxHeight, Number(book.height_cm ?? maxHeight));
    return {
      name: book.title ?? "Book",
      sku: book.slug ?? "book",
      units: it.quantity,
      sellingPricePaise: it.unit_price_paise,
    };
  });

  let shipmentId: number;
  let awbCode: string | undefined;
  let courierName: string | undefined;

  try {
    const created = await createShiprocketOrder({
      orderId: existing.order_number,
      orderDate: new Date(existing.created_at).toISOString().replace("T", " ").slice(0, 16),
      billing: {
        name: addr.name ?? customer?.full_name ?? "Customer",
        address: [addr.line1, addr.line2].filter(Boolean).join(", "),
        city: addr.city,
        pincode: addr.pincode,
        state: addr.state ?? "",
        country: addr.country ?? "India",
        email: customer?.email ?? "",
        phone: addr.phone,
      },
      items: shipItems,
      paymentMethod: "Prepaid",
      subTotalPaise: existing.subtotal_paise,
      weightGrams: totalWeight,
      lengthCm: maxLength,
      breadthCm: maxBreadth,
      heightCm: maxHeight,
    });
    shipmentId = created.shipmentId;
    awbCode = created.awbCode;
    courierName = created.courierName;
  } catch (err) {
    if (err instanceof ShiprocketError) {
      console.error(
        "[admin-orders] Shiprocket createOrder failed:",
        err.message,
        "status=",
        err.status,
        "body=",
        JSON.stringify(err.body),
      );
    } else {
      console.error("[admin-orders] Shiprocket createOrder failed:", err);
    }
    return;
  }

  // If Shiprocket didn't auto-assign an AWB, ask explicitly.
  if (!awbCode) {
    try {
      const assigned = await assignAwb(shipmentId);
      awbCode = assigned.awbCode;
      courierName = assigned.courierName;
    } catch (err) {
      console.error(
        "[admin-orders] Shiprocket assignAwb failed — Shipment id:",
        shipmentId,
        err instanceof ShiprocketError ? err.message : err,
      );
      return;
    }
  }

  if (!awbCode) return;

  await service
    .from("orders")
    .update({
      tracking_number: awbCode,
      courier_name: courierName ?? "shiprocket",
      tracking_url: `https://shiprocket.co/tracking/${awbCode}`,
    } as never)
    .eq("id", orderId);
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

/* ============================================================
 * Abandoned checkouts (#84) — count + bulk clear.
 *
 * `pending_payment` rows older than Razorpay's TTL are dead weight.
 * The cron at /api/cron/cancel-abandoned sweeps them automatically;
 * these give Mom a manual count + "Clear now" button as a backstop.
 * ============================================================ */
export async function getAbandonedCount(): Promise<ActionResult<{ count: number }>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const count = await countAbandonedOrders(createServiceClient());
  return { success: true, data: { count } };
}

export async function clearAbandonedOrders(): Promise<ActionResult<{ cancelled: number }>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  try {
    const { cancelled } = await sweepAbandonedOrders(createServiceClient());
    revalidatePath("/admin/orders");
    return { success: true, data: { cancelled } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not clear abandoned orders.",
    };
  }
}

