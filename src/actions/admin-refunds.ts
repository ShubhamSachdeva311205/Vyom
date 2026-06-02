"use server";

/**
 * Admin Refund Server Actions — Phase 3.4 / Issue #97.
 *
 * Two paths:
 *   - refundOrder({orderId, amountPaise, reason}) — calls Razorpay's
 *     payments.refund API, updates orders.refunded_paise + status,
 *     restocks inventory if the order had been decremented, writes
 *     admin_audit_logs.
 *   - declineRefund({orderId, reason}) — no money moves, just an
 *     audit_log row so we have a paper trail.
 *
 * Both admin-gated. Both revalidate /admin/orders/[id].
 *
 * Side-note: Razorpay's refund API is async — the actual money movement
 * happens later and `refund.processed` webhook is the confirmation. We
 * update our DB optimistically on a successful API call (refund object
 * with status='created' or 'processed'). The webhook handler is
 * idempotent so it re-converges if anything diverges.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
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

/* ============================================================
 * refundOrder
 * ============================================================ */
const refundInput = z.object({
  orderId: z.string().uuid(),
  amountPaise: z.number().int().min(1),
  reason: z.string().trim().min(2).max(500),
});

export async function refundOrder(
  input: z.input<typeof refundInput>,
): Promise<ActionResult<{ refundedTotal: number; status: string }>> {
  const parsed = refundInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();

  // Load the order. Need: razorpay_payment_id, total_paise, refunded_paise.
  const { data: order } = await service
    .from("orders")
    .select("*")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  if (!order) return { success: false, error: "Order not found." };
  if (!order.razorpay_payment_id) {
    return { success: false, error: "No Razorpay payment captured for this order yet." };
  }

  const orderExtra = order as unknown as {
    refunded_paise: number | null;
    inventory_decremented_at: string | null;
    inventory_restocked_at: string | null;
  };
  const alreadyRefunded = orderExtra.refunded_paise ?? 0;
  const remaining = order.total_paise - alreadyRefunded;
  if (parsed.data.amountPaise > remaining) {
    return {
      success: false,
      error: `Can only refund up to ₹${Math.round(remaining / 100)}.`,
    };
  }

  // Call Razorpay.
  type RefundResp = { id: string; status: string; amount: number };
  let refund: RefundResp;
  try {
    const client = getRazorpayClient();
    refund = (await client.payments.refund(order.razorpay_payment_id, {
      amount: parsed.data.amountPaise,
      notes: { reason: parsed.data.reason, admin_email: gate.email },
    })) as unknown as RefundResp;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Razorpay refund failed.";
    console.error("[admin-refunds] Razorpay refund threw:", err);
    return { success: false, error: msg };
  }

  // Update our row.
  const newRefunded = Math.min(order.total_paise, alreadyRefunded + parsed.data.amountPaise);
  const newStatus =
    newRefunded >= order.total_paise ? "refunded" : "partially_refunded";

  await service
    .from("orders")
    .update({
      refunded_paise: newRefunded,
    } as never)
    .eq("id", order.id);

  // Status flip + audit log via the existing SECURITY DEFINER RPC.
  await service.rpc("update_order_status" as never, {
    p_order_id: order.id,
    p_new_status: newStatus,
    p_notes: `Refunded ₹${Math.round(parsed.data.amountPaise / 100)} via Razorpay (${refund.id}). Reason: ${parsed.data.reason}`,
  } as never);

  // Restock inventory if the order had been decremented and isn't
  // already restocked.
  if (
    orderExtra.inventory_decremented_at &&
    !orderExtra.inventory_restocked_at
  ) {
    const { data: restockData, error: restockErr } = await service.rpc(
      "restock_inventory" as never,
      { p_order_id: order.id } as never,
    );
    if (restockErr) {
      console.error("[admin-refunds] restock failed:", restockErr);
    } else {
      type RpcRow = { ok: boolean; reason: string };
      const row = (Array.isArray(restockData) ? restockData[0] : restockData) as RpcRow | null;
      if (row && !row.ok && row.reason !== "already_done") {
        console.error("[admin-refunds] restock returned:", row.reason);
      }
    }
  }

  // Write the refund-level audit log entry (the RPC writes the status-
  // change one; this one captures the refund-specific detail).
  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "order.refund",
    target_table: "orders",
    target_id: order.id,
    details: {
      amount_paise: parsed.data.amountPaise,
      razorpay_refund_id: refund.id,
      refund_status: refund.status,
      reason: parsed.data.reason,
      refunded_total_after: newRefunded,
    },
  });

  // Phase 7 hook: trigger "refund processed" email once Resend is wired.
  // TODO(Phase 7): await sendRefundEmail({ orderId, amountPaise, reason });

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");

  return {
    success: true,
    data: { refundedTotal: newRefunded, status: newStatus },
  };
}

/* ============================================================
 * declineRefund — paper trail only.
 * ============================================================ */
const declineInput = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().min(10).max(1000),
});

export async function declineRefund(
  input: z.input<typeof declineInput>,
): Promise<ActionResult> {
  const parsed = declineInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: "order.refund_declined",
    target_table: "orders",
    target_id: parsed.data.orderId,
    details: { reason: parsed.data.reason },
  });

  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return { success: true };
}
