import crypto from "node:crypto";
import { NextResponse } from "next/server";
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
    .select("id, status")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (!order) return;

  // Idempotent: if the inline verify already flipped us, leave it.
  if (order.status !== "pending_payment") return;

  await service
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: payment.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id);
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
  await service
    .from("orders")
    .update({ status: "refunded" })
    .eq("razorpay_payment_id", refund.payment_id);
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
      };
    };
    refund?: {
      entity?: { payment_id?: string };
    };
  };
}
