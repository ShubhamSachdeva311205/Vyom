import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { EMAIL_FROM, getResend, SITE_URL } from "./client";

interface LineItem {
  title: string;
  quantity: number;
}

function buildHtml(data: {
  orderNumber: string;
  items: LineItem[];
  courier: string;
  awb: string;
  trackingUrl: string;
  orderUrl: string;
}): string {
  const itemRows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111">${i.title}${i.quantity > 1 ? ` × ${i.quantity}` : ""}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">Vyom</div>
    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 6px">Your order is on its way 📦</h1>
      <p style="margin:0 0 20px;color:#555">Order <strong>#${data.orderNumber}</strong> has shipped. Here's how to track it:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:4px 0;color:#555">Courier</td><td style="padding:4px 0;text-align:right;color:#111">${data.courier}</td></tr>
        <tr><td style="padding:4px 0;color:#555">Tracking no.</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#111">${data.awb}</td></tr>
      </table>
      <a href="${data.trackingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 18px;border-radius:9px;font-size:14px;font-weight:600">Track your shipment</a>
      <p style="margin:22px 0 6px;color:#555;font-size:14px">In this parcel:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
      <a href="${data.orderUrl}" style="display:inline-block;margin-top:18px;color:#111;font-size:14px">View order &amp; invoice →</a>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Vyom · Premium IBDP &amp; IGCSE Hindi study resources</p>
  </div></body></html>`;
}

/**
 * Sends the "your order has shipped" email (#89). Idempotent: an atomic claim
 * on orders.shipped_email_sent_at means the two callers (admin Mark-as-Shipped
 * and the Shiprocket webhook) can't double-send. No-ops when Resend isn't
 * configured or the order has no AWB yet. Never throws into the status path.
 */
export async function sendShippedEmail(orderId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // no key configured — skip silently

  const service = createServiceClient();

  // Need an AWB to send a meaningful email. If tracking isn't on the row yet
  // (e.g. Shiprocket auto-create failed), skip — Mom can re-trigger by saving
  // tracking + re-flipping, or the webhook will catch it.
  const { data: pre } = await service
    .from("orders")
    .select("tracking_number, shipped_email_sent_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!pre || pre.shipped_email_sent_at || !pre.tracking_number) return;

  // Atomically claim the send.
  const { data: order } = await service
    .from("orders")
    .update({ shipped_email_sent_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("shipped_email_sent_at", null)
    .select("id, user_id, order_number, tracking_number, courier_name, tracking_url")
    .maybeSingle();
  if (!order) return;

  const unclaim = () =>
    service.from("orders").update({ shipped_email_sent_at: null }).eq("id", orderId);

  try {
    if (!order.user_id) return; // guest orders have no account email
    const { data: userRes } = await service.auth.admin.getUserById(order.user_id);
    const to = userRes?.user?.email;
    if (!to) {
      await unclaim();
      return;
    }

    const { data: items } = await service
      .from("order_items")
      .select("quantity, books(title)")
      .eq("order_id", orderId);
    const lineItems: LineItem[] = (items ?? []).map((it) => {
      const book = it.books as { title?: string } | { title?: string }[] | null;
      const title = Array.isArray(book) ? book[0]?.title : book?.title;
      return { title: title ?? "Book", quantity: it.quantity };
    });

    const awb = order.tracking_number ?? "";
    const html = buildHtml({
      orderNumber: order.order_number ?? order.id.slice(0, 8),
      items: lineItems,
      courier: order.courier_name ?? "Shiprocket",
      awb,
      trackingUrl: order.tracking_url ?? `https://shiprocket.co/tracking/${awb}`,
      orderUrl: `${SITE_URL}/order/${orderId}/success`,
    });

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your Vyom order #${order.order_number ?? ""} has shipped`,
      html,
    });
    if (error) {
      console.error("[email] shipped send failed:", error);
      await unclaim();
    }
  } catch (e) {
    console.error("[email] shipped threw:", e);
    await unclaim();
  }
}
