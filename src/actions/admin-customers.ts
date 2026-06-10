"use server";

/**
 * Admin customer lookup (C5). Search by email or name → profile +
 * order history + digital access grants, so Mom can answer "what did
 * this person buy / what do they have access to" from one place.
 */

import { z } from "zod";
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

export interface CustomerHit {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  orderCount: number;
  totalSpentPaise: number;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    createdAt: string;
  }>;
  grants: Array<{ id: string; bookTitle: string; source: string; revoked: boolean }>;
}

const searchInput = z.object({ query: z.string().trim().min(1).max(200) });

export async function searchCustomers(
  input: z.input<typeof searchInput>,
): Promise<ActionResult<CustomerHit[]>> {
  const parsed = searchInput.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter an email or name." };
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const q = parsed.data.query.replace(/[%,]/g, "");

  const { data: users, error } = await service
    .from("users")
    .select("id, email, full_name, created_at")
    .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(10);
  if (error) return { success: false, error: error.message };
  if (!users || users.length === 0) return { success: true, data: [] };

  const ids = users.map((u) => u.id);

  // Orders for these users (exclude abandoned).
  const { data: orders } = await service
    .from("orders")
    .select("id, user_id, order_number, status, total_paise, created_at")
    .in("user_id", ids)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false });

  // Grants for these users.
  const { data: grants } = await service
    .from("access_grants")
    .select("id, user_id, source, revoked_at, book:books(title)")
    .in("user_id", ids);

  const ordersByUser = new Map<string, NonNullable<typeof orders>>();
  for (const o of orders ?? []) {
    const list = ordersByUser.get(o.user_id) ?? [];
    list.push(o);
    ordersByUser.set(o.user_id, list);
  }
  type GrantRow = {
    id: string;
    user_id: string;
    source: string;
    revoked_at: string | null;
    book: { title: string } | null;
  };
  const grantsByUser = new Map<string, GrantRow[]>();
  for (const g of (grants ?? []) as unknown as GrantRow[]) {
    const list = grantsByUser.get(g.user_id) ?? [];
    list.push(g);
    grantsByUser.set(g.user_id, list);
  }

  const hits: CustomerHit[] = users.map((u) => {
    const uOrders = ordersByUser.get(u.id) ?? [];
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      createdAt: u.created_at,
      orderCount: uOrders.length,
      totalSpentPaise: uOrders.reduce((sum, o) => sum + o.total_paise, 0),
      orders: uOrders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status,
        totalPaise: o.total_paise,
        createdAt: o.created_at,
      })),
      grants: (grantsByUser.get(u.id) ?? []).map((g) => ({
        id: g.id,
        bookTitle: g.book?.title ?? "—",
        source: g.source,
        revoked: Boolean(g.revoked_at),
      })),
    };
  });

  return { success: true, data: hits };
}
