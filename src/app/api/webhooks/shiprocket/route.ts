import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sendDeliveredEmail } from "@/lib/email/delivered";
import { sendShippedEmail } from "@/lib/email/shipped";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/webhooks/shiprocket  (#87)
 *
 * Shiprocket POSTs shipment-lifecycle events here. It authenticates with a
 * shared token in the `x-api-key` header (no HMAC of the body, unlike
 * Razorpay) — we compare it constant-time against SHIPROCKET_WEBHOOK_TOKEN.
 *
 * We look up our order by AWB (tracking_number), map Shiprocket's status to
 * our order_status, and roll the order forward via the service client. The
 * update is system-initiated (no admin session), so we write the audit row
 * ourselves rather than going through the admin-only update_order_status RPC.
 *
 * Idempotent: we only ever move FORWARD in the lifecycle, so webhook resends
 * (or out-of-order scans) never regress a delivered order back to shipped.
 *
 * Setup for Mom: Shiprocket panel → Settings → API → Webhooks → set the URL
 * to https://<domain>/api/webhooks/shiprocket and the token to match env.
 */
export const dynamic = "force-dynamic";

// Our lifecycle, ordered. Higher index = further along. We never move
// backwards; cancelled/on_hold are terminal-ish side states handled explicitly.
const FORWARD_RANK: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
};

/** Map a Shiprocket status string → our order_status (or null = ignore). */
function mapStatus(raw: string): string | null {
  const s = raw.toLowerCase().trim();
  if (/(out for delivery|in transit|pickup done|picked up|shipped)/.test(s)) return "shipped";
  if (/delivered/.test(s)) return "delivered";
  if (/(rto|returned|return)/.test(s)) return "on_hold";
  if (/(cancel|lost|destroyed)/.test(s)) return "cancelled";
  // Manifested / pickup scheduled / pickup pending → we're already "packed".
  return null;
}

interface ShiprocketWebhookBody {
  awb?: string;
  current_status?: string;
  courier_name?: string;
  shipment_status?: string;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  if (!env.SHIPROCKET_WEBHOOK_TOKEN) {
    return new NextResponse("Webhook token not configured", { status: 503 });
  }
  const token = request.headers.get("x-api-key");
  if (!token || !safeEqual(token, env.SHIPROCKET_WEBHOOK_TOKEN)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: ShiprocketWebhookBody;
  try {
    body = (await request.json()) as ShiprocketWebhookBody;
  } catch {
    return new NextResponse("Malformed body", { status: 400 });
  }

  const awb = (body.awb ?? "").trim();
  const rawStatus = (body.current_status ?? body.shipment_status ?? "").trim();
  if (!awb || !rawStatus) {
    // Acknowledge so Shiprocket stops retrying a payload we can't use.
    return NextResponse.json({ ok: true, ignored: "missing awb or status" });
  }

  const target = mapStatus(rawStatus);
  if (!target) {
    return NextResponse.json({ ok: true, ignored: `unmapped status "${rawStatus}"` });
  }

  const service = createServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id, status, courier_name")
    .eq("tracking_number", awb)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ ok: true, ignored: `no order for AWB ${awb}` });
  }

  // Only roll forward through the normal lifecycle. cancelled / on_hold are
  // exceptions an admin should see, so we always apply those.
  const curRank = FORWARD_RANK[order.status] ?? -1;
  const targetRank = FORWARD_RANK[target] ?? -1;
  const isException = target === "cancelled" || target === "on_hold";
  if (!isException && targetRank <= curRank) {
    return NextResponse.json({ ok: true, noop: `${order.status} → ${target} not forward` });
  }
  if (order.status === target) {
    return NextResponse.json({ ok: true, noop: "already in target status" });
  }

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = { status: target };
  if (target === "shipped") patch.shipped_at = nowIso;
  if (target === "delivered") patch.delivered_at = nowIso;
  if (target === "on_hold") patch.on_hold_at = nowIso;
  if (body.courier_name && !order.courier_name) patch.courier_name = body.courier_name;

  const { error: upErr } = await service
    .from("orders")
    .update(patch as never)
    .eq("id", order.id);
  if (upErr) {
    console.error("[shiprocket-webhook] update failed:", upErr.message);
    return new NextResponse("Update failed", { status: 500 });
  }

  // System-initiated audit row (no admin actor).
  await service.from("admin_audit_logs").insert({
    admin_id: null,
    admin_email: "system:shiprocket-webhook",
    action: "order.status_update",
    target_table: "orders",
    target_id: order.id,
    details: { new_status: target, awb, shiprocket_status: rawStatus },
  } as never);

  // Notify the customer when it ships (idempotent; no-ops if already sent).
  if (target === "shipped") {
    try {
      await sendShippedEmail(order.id);
    } catch (e) {
      console.error("[shiprocket-webhook] shipped email threw:", e);
    }
  }

  // Notify the customer when it's delivered (idempotent; no-ops if already sent).
  if (target === "delivered") {
    try {
      await sendDeliveredEmail(order.id);
    } catch (e) {
      console.error("[shiprocket-webhook] delivered email threw:", e);
    }
  }

  return NextResponse.json({ ok: true, status: target });
}
