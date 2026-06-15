import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email/order-confirmation";
import { sendRefundEmail } from "@/lib/email/refund";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Razorpay webhook receiver. Razorpay POSTs payment + refund events
 * here with an `X-Razorpay-Signature` header — HMAC-SHA256 of the raw
 * body using our RAZORPAY_WEBHOOK_SECRET.
 *
 * We verify the signature in constant time BEFORE parsing JSON. Any
 * verify failure returns 401 — Razorpay retries with exponential
 * backoff, which is fine.
 *
 * The webhook is the SECONDARY mark-paid path. The PRIMARY is the
 * inline verifyPaymentAndCompleteOrder Server Action called from the
 * Checkout modal's handler — that gives instant UI feedback. The
 * webhook closes the loop if the user closes the browser before our
 * inline verify fires, or if the modal handler errored.
 *
 * Both paths are idempotent (status check before update).
 *
 * Events we handle:
 *   - payment.captured  → mark order paid, stamp payment_id
 *   - payment.failed    → log; leave order in pending_payment for retry
 *   - refund.processed  → mark order refunded (Phase 3.4 expansion)
 *
 * Other events are 200-OK acknowledged but ignored.
 */

export async function POST(request: Request) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    // Webhook arrived but secret isn't configured. Reject loudly so
    // Razorpay's dashboard shows the failure + we don't silently swallow.
    return new NextResponse("Webhook secret not configured", { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  // We MUST verify against the raw body, not the parsed JSON.
  const rawBody = await request.text();
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!safeEqualHex(expected, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return new NextResponse("Malformed body", { status: 400 });
  }

  switch (payload.event) {
    case "payment.captured":
      await handlePaymentCaptured(payload);
      break;
    case "payment.failed":
      await handlePaymentFailed(payload);
      break;
    case "refund.processed":
      await handleRefundProcessed(payload);
      break;
    default:
      // Acknowledged but ignored.
      break;
  }

  return NextResponse.json({ ok: true });
}

/* -----------------------------------------------------------------
 * Handlers
 * ----------------------------------------------------------------- */

async function handlePaymentCaptured(payload: WebhookPayload): Promise<void> {
  const payment = payload.payload?.payment?.entity;
  if (!payment?.order_id || !payment?.id) return;

  const service = createServiceClient();

  // Look up our order by Razorpay's order id.
  const { data: order } = await service
    .from("orders")
    .select("id, status, coupon_code, user_id, subtotal_paise")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!order) return;

  // Idempotent: if the inline verify already flipped us, leave the
  // status untouched but STILL attempt inventory decrement below (the
  // RPC has its own idempotency stamp).
  const fee = (payment.fee ?? 0) + (payment.tax ?? 0);
  if (order.status === "pending_payment") {
    await service
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: payment.id,
        paid_at: new Date().toISOString(),
        // Stamp the actual Razorpay fee so the refund dialog knows
        // exactly what's non-refundable. Falls back to ~2.36%
        // estimate in the UI when this is null (pre-fix orders).
        non_refundable_fee_paise: fee > 0 ? fee : null,
      } as never)
      .eq("id", order.id);
  } else if (fee > 0) {
    // Status already flipped by inline verify, but we still want the
    // fee number for refund math.
    await service
      .from("orders")
      .update({ non_refundable_fee_paise: fee } as never)
      .eq("id", order.id);
  }

  // Atomic inventory decrement. Refunds the payment if any line is out
  // of stock — but that's a Phase 3.4 follow-up (#97 refund UI); for
  // now we just flag the order via admin_notes so Mom can act.
  await decrementInventoryForOrder(order.id);

  // Grant digital access (audio / answer-key) for books with companions.
  // Idempotent — the inline verify may have already done it.
  const { error: grantErr } = await service.rpc(
    "grant_digital_access" as never,
    { p_order_id: order.id } as never,
  );
  if (grantErr) {
    console.error("[razorpay-webhook] grant_digital_access threw:", grantErr);
  }

  // Redeem the coupon. When the customer closes the tab before the inline
  // verify path runs, this webhook is the ONLY thing that completes the
  // order — without this, a single-use vendor code stays "unused" and can
  // be redeemed again (#78). Guard against double-redeem (the inline path
  // may have already written a redemption for this order).
  await redeemCouponForOrder(order.id, order.coupon_code, order.user_id, order.subtotal_paise);

  // Order-confirmation email (idempotent; only one path actually sends).
  await sendOrderConfirmation(order.id);
}

async function redeemCouponForOrder(
  orderId: string,
  couponCode: string | null,
  userId: string | null,
  subtotalPaise: number | null,
): Promise<void> {
  if (!couponCode || !userId) return;
  const service = createServiceClient();

  // Idempotency: skip if a redemption already exists for this order.
  const { data: existing } = await service
    .from("coupon_redemptions")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) return;

  const { data: redeem, error: redeemErr } = await service.rpc("redeem_coupon" as never, {
    p_code: couponCode,
    p_user_id: userId,
    p_order_id: orderId,
    p_eligible_subtotal_paise: subtotalPaise ?? 0,
  } as never);
  type RpcRow = { success: boolean; reason: string };
  const row = (Array.isArray(redeem) ? redeem[0] : redeem) as RpcRow | null;
  if (redeemErr || !row?.success) {
    console.error("[razorpay-webhook] coupon redeem failed:", {
      orderId,
      reason: row?.reason ?? redeemErr?.message ?? "unknown",
    });
  }
}

async function decrementInventoryForOrder(orderId: string): Promise<void> {
  const service = createServiceClient();
  type RpcRow = { ok: boolean; reason: string };
  const { data, error } = await service.rpc(
    "decrement_inventory" as never,
    { p_order_id: orderId } as never,
  );
  if (error) {
    console.error("[razorpay-webhook] decrement_inventory threw:", error);
    return;
  }
  const row = (Array.isArray(data) ? data[0] : data) as RpcRow | null;
  if (!row) return;
  if (row.ok) return;
  if (row.reason === "already_done") return;

  // Insufficient stock or book-not-found. Flag the order so Mom sees it
  // on /admin/orders. Refund automation lands with #97.
  console.error(
    "[razorpay-webhook] inventory decrement failed for paid order:",
    { orderId, reason: row.reason },
  );
  await service
    .from("orders")
    .update({
      admin_notes:
        `STOCK ISSUE on payment: decrement_inventory returned "${row.reason}". ` +
        "Manual refund + restock required.",
    } as never)
    .eq("id", orderId);
}

async function handlePaymentFailed(payload: WebhookPayload): Promise<void> {
  const payment = payload.payload?.payment?.entity;
  if (!payment?.order_id) return;

  // For now: just log to the order's notes column for admin visibility.
  // Phase 3.4 will properly model payment_attempts.
  const service = createServiceClient();
  await service
    .from("orders")
    .update({
      notes: `Payment failed: ${payment.error_description ?? "unknown"} (code ${payment.error_code ?? "n/a"})`,
    })
    .eq("razorpay_order_id", payment.order_id);
}

async function handleRefundProcessed(payload: WebhookPayload): Promise<void> {
  const refund = payload.payload?.refund?.entity;
  if (!refund?.payment_id) return;

  const service = createServiceClient();
  // Look up the order so we can do cumulative math + status logic.
  // refunded_paise was added by migration 20260602204644 — cast
  // through unknown until generated types regenerate.
  const { data: order } = await service
    .from("orders")
    .select("id, total_paise")
    .eq("razorpay_payment_id", refund.payment_id)
    .maybeSingle();
  if (!order) return;

  const { data: refundedRow } = await service
    .from("orders")
    .select("*")
    .eq("id", order.id)
    .maybeSingle();
  const alreadyRefunded =
    ((refundedRow as unknown as { refunded_paise?: number | null } | null)
      ?.refunded_paise) ?? 0;
  const refundAmount = refund.amount ?? 0;
  const newRefunded = Math.min(order.total_paise, alreadyRefunded + refundAmount);
  const newStatus =
    newRefunded >= order.total_paise ? "refunded" : "partially_refunded";

  // Idempotent: if our refund action already updated to this amount,
  // the row will already match — no-op write is harmless.
  await service
    .from("orders")
    .update({
      status: newStatus,
      refunded_paise: newRefunded,
    } as never)
    .eq("id", order.id);

  // Notify the customer (+ admin copy) that their refund was issued. Reads the
  // now-updated refunded_paise. Idempotent; no-ops if already sent.
  try {
    await sendRefundEmail(order.id);
  } catch (e) {
    console.error("[razorpay-webhook] refund email threw:", e);
  }
}

/* -----------------------------------------------------------------
 * Helpers + payload typing
 * ----------------------------------------------------------------- */

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

interface WebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        error_code?: string;
        error_description?: string;
        /** Razorpay fee in paise (non-refundable on refunds). */
        fee?: number;
        /** GST on the fee, in paise (also non-refundable). */
        tax?: number;
      };
    };
    refund?: {
      entity?: { payment_id?: string; amount?: number };
    };
  };
}
