import { type NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sweepAbandonedOrders } from "@/lib/orders/abandoned";

/**
 * GET /api/cron/cancel-abandoned  (Issue #84, v2)
 *
 * Scheduled sweep that cancels `pending_payment` orders older than the
 * Razorpay TTL (~30 min). Wired to Vercel Cron via `vercel.json`.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the
 * CRON_SECRET env var is set. We require it — without a matching secret
 * this endpoint is a public no-op (401), so it can't be used to probe
 * order state or trigger writes.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cancel-abandoned] CRON_SECRET not configured — refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const service = createServiceClient();
    const { cancelled, orderNumbers } = await sweepAbandonedOrders(service);
    if (cancelled > 0) {
      console.info(`[cron/cancel-abandoned] cancelled ${cancelled}:`, orderNumbers.join(", "));
    }
    return NextResponse.json({ ok: true, cancelled });
  } catch (err) {
    console.error("[cron/cancel-abandoned] sweep error:", err);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
