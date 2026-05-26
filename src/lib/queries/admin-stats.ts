import { createClient } from "@/lib/supabase/server";

/**
 * Admin dashboard stat counters. Server-only — call from admin Server
 * Components. RLS lets through because we expect the caller to already
 * be admin-gated by middleware.
 *
 * Uses HEAD + count='exact' to avoid pulling row data for counts.
 */

export interface AdminStats {
  bookCount: number;
  lowStockCount: number;
  ordersNew: number;
  ordersPacked: number;
  ordersShipped: number;
  pendingSubmissions: number;
  unreadFeedback: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();

  const [books, lowStock, ordersNew, ordersPacked, ordersShipped, pending, feedback] =
    await Promise.all([
      supabase.from("books").select("*", { count: "exact", head: true }),
      supabase.from("books").select("*", { count: "exact", head: true }).lt("inventory_count", 5),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending_payment"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "packed"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "shipped"),
      supabase.from("content_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("feedback").select("*", { count: "exact", head: true }).eq("resolved", false),
    ]);

  return {
    bookCount: books.count ?? 0,
    lowStockCount: lowStock.count ?? 0,
    ordersNew: ordersNew.count ?? 0,
    ordersPacked: ordersPacked.count ?? 0,
    ordersShipped: ordersShipped.count ?? 0,
    pendingSubmissions: pending.count ?? 0,
    unreadFeedback: feedback.count ?? 0,
  };
}
