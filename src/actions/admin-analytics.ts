"use server";

/**
 * Admin business analytics (#71). Server-side aggregation over existing
 * tables — no new tables, no new demographic collection. Answers WHO buys,
 * WHAT, and WHEN, to inform stocking and ad timing.
 *
 * Like the sales report, every metric counts PAID orders only (status past
 * pending_payment and not cancelled). The PAID_STATUSES list here mirrors
 * admin-reports.ts exactly.
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

const PAID_STATUSES = [
  "paid",
  "packed",
  "shipped",
  "delivered",
  "refunded",
  "partially_refunded",
  "on_hold",
];

/**
 * Fetch the ids of paid orders in the range, once, so the per-dataset
 * aggregations can scope their order_items / address lookups.
 */
async function paidOrderIds(
  service: ReturnType<typeof createServiceClient>,
  fromISO: string,
  toISO: string,
): Promise<{ ids: string[]; error?: string }> {
  const { data, error } = await service
    .from("orders")
    .select("id, status")
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .neq("status", "pending_payment");
  if (error) return { ids: [], error: error.message };
  const ids = (data ?? [])
    .filter((o) => PAID_STATUSES.includes(o.status))
    .map((o) => o.id);
  return { ids };
}

/* ---------------------------------------------------------------- Top books */

export interface TopBookRow {
  bookId: string;
  title: string;
  units: number;
  revenuePaise: number;
}

/**
 * Best-selling books in the range, ranked by units sold, with line revenue.
 */
export async function getTopBooks(
  fromISO: string,
  toISO: string,
): Promise<ActionResult<TopBookRow[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { ids, error: idErr } = await paidOrderIds(service, fromISO, toISO);
  if (idErr) return { success: false, error: idErr };
  if (ids.length === 0) return { success: true, data: [] };

  const { data: items, error } = await service
    .from("order_items")
    .select("book_id, quantity, final_price_paise, unit_price_paise, books(title)")
    .in("order_id", ids);
  if (error) return { success: false, error: error.message };

  const byBook = new Map<string, TopBookRow>();
  for (const it of items ?? []) {
    const row = it as unknown as {
      book_id: string;
      quantity: number;
      final_price_paise: number | null;
      unit_price_paise: number;
      books: { title?: string } | { title?: string }[] | null;
    };
    const book = Array.isArray(row.books) ? row.books[0] : row.books;
    const title = book?.title ?? "Unknown book";
    // final_price_paise is the (post-discount) line total; older rows may be 0,
    // so fall back to unit price × quantity.
    const lineRevenue =
      row.final_price_paise && row.final_price_paise > 0
        ? row.final_price_paise
        : row.unit_price_paise * row.quantity;
    const cur =
      byBook.get(row.book_id) ?? { bookId: row.book_id, title, units: 0, revenuePaise: 0 };
    cur.units += row.quantity;
    cur.revenuePaise += lineRevenue;
    byBook.set(row.book_id, cur);
  }

  return {
    success: true,
    data: [...byBook.values()]
      .sort((a, b) => b.units - a.units || b.revenuePaise - a.revenuePaise)
      .slice(0, 20),
  };
}

/* --------------------------------------------------------------- By city */

export interface CityRow {
  city: string;
  orders: number;
  revenuePaise: number;
}
export interface PincodeRow {
  pincode: string;
  orders: number;
}
export interface GeoBreakdown {
  cities: CityRow[];
  pincodes: PincodeRow[];
}

/**
 * Order counts + revenue grouped by shipping city (top ~15) and a top-pincodes
 * list. Reads city from the shipping_address JSON and the dedicated
 * shipping_pincode column.
 */
export async function getSalesByCity(
  fromISO: string,
  toISO: string,
): Promise<ActionResult<GeoBreakdown>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from("orders")
    .select("status, total_paise, shipping_address, shipping_pincode")
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .neq("status", "pending_payment");
  if (error) return { success: false, error: error.message };

  const cityMap = new Map<string, CityRow>();
  const pinMap = new Map<string, PincodeRow>();
  for (const o of orders ?? []) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const row = o as unknown as {
      total_paise: number;
      shipping_address: { city?: string } | null;
      shipping_pincode: string | null;
    };
    const rawCity = row.shipping_address?.city?.trim();
    const city = rawCity ? rawCity : "Unknown";
    const c = cityMap.get(city) ?? { city, orders: 0, revenuePaise: 0 };
    c.orders += 1;
    c.revenuePaise += row.total_paise;
    cityMap.set(city, c);

    const pin = row.shipping_pincode?.trim();
    if (pin) {
      const p = pinMap.get(pin) ?? { pincode: pin, orders: 0 };
      p.orders += 1;
      pinMap.set(pin, p);
    }
  }

  return {
    success: true,
    data: {
      cities: [...cityMap.values()]
        .sort((a, b) => b.orders - a.orders || b.revenuePaise - a.revenuePaise)
        .slice(0, 15),
      pincodes: [...pinMap.values()]
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 15),
    },
  };
}

/* ----------------------------------------------------- Repeat customers */

export interface RepeatBuyer {
  email: string;
  orders: number;
}
export interface RepeatStats {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number; // 0–1
  topRepeat: RepeatBuyer[];
}

/**
 * Share of customers with more than one paid order in the range, plus a short
 * leaderboard of the most frequent buyers (by email).
 */
export async function getRepeatCustomers(
  fromISO: string,
  toISO: string,
): Promise<ActionResult<RepeatStats>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from("orders")
    .select("status, user_id, users(email)")
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .neq("status", "pending_payment");
  if (error) return { success: false, error: error.message };

  const counts = new Map<string, { email: string; orders: number }>();
  for (const o of orders ?? []) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const row = o as unknown as {
      user_id: string;
      users: { email?: string } | { email?: string }[] | null;
    };
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    const email = u?.email ?? row.user_id;
    const cur = counts.get(row.user_id) ?? { email, orders: 0 };
    cur.orders += 1;
    counts.set(row.user_id, cur);
  }

  const all = [...counts.values()];
  const repeat = all.filter((c) => c.orders > 1);

  return {
    success: true,
    data: {
      totalCustomers: all.length,
      repeatCustomers: repeat.length,
      repeatRate: all.length > 0 ? repeat.length / all.length : 0,
      topRepeat: repeat
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10)
        .map((c) => ({ email: c.email, orders: c.orders })),
    },
  };
}

/* ---------------------------------------------------- Orders by hour */

export interface HourBucket {
  hour: number; // 0–23 (local IST render handled client-side via label)
  orders: number;
}

/**
 * Paid order counts bucketed by hour-of-day (0–23), from paid_at (falling back
 * to created_at). Informs the best time to run ads.
 */
export async function getOrdersByHour(
  fromISO: string,
  toISO: string,
): Promise<ActionResult<HourBucket[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { data: orders, error } = await service
    .from("orders")
    .select("status, paid_at, created_at")
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .neq("status", "pending_payment");
  if (error) return { success: false, error: error.message };

  const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    orders: 0,
  }));
  for (const o of orders ?? []) {
    if (!PAID_STATUSES.includes(o.status)) continue;
    const row = o as unknown as { paid_at: string | null; created_at: string };
    const when = new Date(row.paid_at ?? row.created_at);
    // Bucket by IST hour (UTC+5:30) — Mom's customers and ad audience are in India.
    const istHour = new Date(when.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
    buckets[istHour].orders += 1;
  }

  return { success: true, data: buckets };
}
