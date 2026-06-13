/**
 * Abandoned-checkout cleanup (Issue #84, v2).
 *
 * `createRazorpayOrder` inserts a `pending_payment` orders row BEFORE the
 * customer completes the Razorpay modal. The modal's `ondismiss` handler
 * cancels it if they close the modal — but that misses the cases that
 * actually leave junk behind: closed tab, dead network, browser crash,
 * back-button. Those rows sit at `pending_payment` forever.
 *
 * This sweep cancels any `pending_payment` order older than the cutoff
 * (Razorpay's order TTL is ~30 min, so anything older can never capture).
 * It runs from two callers:
 *   - the scheduled cron route (`/api/cron/cancel-abandoned`)
 *   - the admin "Clear abandoned" bulk action
 * Both pass a service client so the UPDATE bypasses RLS uniformly.
 *
 * Inventory is only decremented on `payment.captured`, so cancelling a
 * pending row never needs a stock restore.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Default age (minutes) past which a pending_payment order is abandoned. */
export const ABANDONED_CUTOFF_MINUTES = 30;

export interface SweepResult {
  cancelled: number;
  orderNumbers: string[];
}

/**
 * Cancel every `pending_payment` order created more than
 * `olderThanMinutes` ago. Returns how many were cancelled.
 *
 * @param service  A service-role Supabase client (bypasses RLS).
 * @param olderThanMinutes  Age cutoff; defaults to {@link ABANDONED_CUTOFF_MINUTES}.
 * @param nowMs  Current epoch ms (injectable for tests; defaults to Date.now()).
 */
export async function sweepAbandonedOrders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: SupabaseClient<any, "public", any>,
  olderThanMinutes: number = ABANDONED_CUTOFF_MINUTES,
  nowMs: number = Date.now(),
): Promise<SweepResult> {
  const cutoffIso = new Date(nowMs - olderThanMinutes * 60_000).toISOString();

  const { data, error } = await service
    .from("orders")
    .update({
      status: "cancelled",
      admin_notes: "Auto-cancelled: abandoned checkout (no payment within TTL).",
    })
    .eq("status", "pending_payment")
    .lt("created_at", cutoffIso)
    .select("order_number");

  if (error) {
    console.error("[abandoned] sweep failed:", error.message);
    throw new Error(error.message);
  }

  const orderNumbers = (data ?? []).map(
    (r) => (r as { order_number: string }).order_number,
  );
  return { cancelled: orderNumbers.length, orderNumbers };
}

/** Count pending_payment rows older than the cutoff (for admin visibility). */
export async function countAbandonedOrders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: SupabaseClient<any, "public", any>,
  olderThanMinutes: number = ABANDONED_CUTOFF_MINUTES,
  nowMs: number = Date.now(),
): Promise<number> {
  const cutoffIso = new Date(nowMs - olderThanMinutes * 60_000).toISOString();
  const { count, error } = await service
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_payment")
    .lt("created_at", cutoffIso);
  if (error) {
    console.error("[abandoned] count failed:", error.message);
    return 0;
  }
  return count ?? 0;
}
