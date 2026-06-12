"use server";

/**
 * Admin sales reporting (C11, v1). Aggregates orders over a date range
 * into KPI numbers + a status breakdown. Charts can layer on later;
 * this gives Mom the headline figures she checks daily.
 *
 * "Revenue" counts only orders that actually got paid (status past
 * pending_payment and not cancelled). Refunds are subtracted to show
 * net.
 */

import { isAdminEmail } from "@/lib/auth/admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };
  if (!(await isAdminEmail(user.email))) return { ok: false, error: "Not authorised." };
  return { ok: true };
}

export interface SalesSummary {
  grossPaise: number;
  refundedPaise: number;
  netPaise: number;
  shippingCollectedPaise: number;
  discountGivenPaise: number;
  orderCount: number;
  unitsSold: number;
  aovPaise: number;
  byStatus: Record<string, number>;
}

const PAID_STATUSES = [
  "paid",
  "packed",
  "shipped",
  "delivered",
  "refunded",
  "partially_refunded",
  "on_hold",
];

export async function getSalesSummary(
  fromISO: string,
  toISO: string,
): Promise<ActionResult<SalesSummary>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from("orders")
    .select(
      "id, status, total_paise, shipping_paise, discount_paise, refunded_paise, created_at",
    )
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .neq("status", "pending_payment");
  if (error) return { success: false, error: error.message };

  const rows = orders ?? [];
  const paid = rows.filter((o) => PAID_STATUSES.includes(o.status));

  const byStatus: Record<string, number> = {};
  for (const o of rows) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  const grossPaise = paid.reduce((s, o) => s + o.total_paise, 0);
  const refundedPaise = paid.reduce(
    (s, o) => s + ((o as unknown as { refunded_paise: number | null }).refunded_paise ?? 0),
    0,
  );
  const shippingCollectedPaise = paid.reduce((s, o) => s + o.shipping_paise, 0);
  const discountGivenPaise = paid.reduce((s, o) => s + o.discount_paise, 0);

  // Units sold across the paid orders.
  let unitsSold = 0;
  if (paid.length > 0) {
    const { data: items } = await service
      .from("order_items")
      .select("quantity, order_id")
      .in("order_id", paid.map((o) => o.id));
    unitsSold = (items ?? []).reduce((s, it) => s + it.quantity, 0);
  }

  return {
    success: true,
    data: {
      grossPaise,
      refundedPaise,
      netPaise: grossPaise - refundedPaise,
      shippingCollectedPaise,
      discountGivenPaise,
      orderCount: paid.length,
      unitsSold,
      aovPaise: paid.length > 0 ? Math.round(grossPaise / paid.length) : 0,
      byStatus,
    },
  };
}

export type Granularity = "day" | "week" | "month";
export interface SalesPoint {
  /** Bucket start (ISO date), for sorting. */
  key: string;
  /** Human label for the axis. */
  label: string;
  revenuePaise: number;
  orders: number;
}

function bucketKey(d: Date, g: Granularity): { key: string; label: string } {
  const y = d.getFullYear();
  if (g === "month") {
    const key = `${y}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) };
  }
  if (g === "week") {
    // Week starting Monday.
    const monday = new Date(d);
    const dow = (monday.getDay() + 6) % 7; // 0 = Monday
    monday.setDate(monday.getDate() - dow);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    return { key, label: monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
  }
  const key = d.toISOString().slice(0, 10);
  return { key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) };
}

/**
 * Revenue + order count bucketed by day / week / month over a range, for the
 * sales chart. Paid orders only.
 */
export async function getSalesTimeSeries(
  fromISO: string,
  toISO: string,
  granularity: Granularity,
): Promise<ActionResult<SalesPoint[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from("orders")
    .select("status, total_paise, paid_at, created_at")
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .neq("status", "pending_payment");
  if (error) return { success: false, error: error.message };

  const buckets = new Map<string, SalesPoint>();
  for (const o of orders ?? []) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const when = new Date(o.paid_at ?? o.created_at);
    const { key, label } = bucketKey(when, granularity);
    const b = buckets.get(key) ?? { key, label, revenuePaise: 0, orders: 0 };
    b.revenuePaise += o.total_paise;
    b.orders += 1;
    buckets.set(key, b);
  }

  return {
    success: true,
    data: [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };
}
