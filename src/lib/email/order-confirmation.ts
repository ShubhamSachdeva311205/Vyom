import "server-only";
import { formatINR } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/server";
import { EMAIL_FROM, getResend, SITE_URL } from "./client";

interface LineItem {
  title: string;
  quantity: number;
  pricePaise: number;
}

function buildHtml(data: {
  orderNumber: string;
  items: LineItem[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  orderUrl: string;
  communityUrl: string;
}): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;color:#555">${label}</td><td style="padding:4px 0;text-align:right;${strong ? "font-weight:600;color:#111" : "color:#333"}">${value}</td></tr>`;

  const itemRows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#111">${i.title}${i.quantity > 1 ? ` × ${i.quantity}` : ""}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#111">${formatINR(i.pricePaise * i.quantity)}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">Vyom</div>
    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 6px">Thank you for your order 🙏</h1>
      <p style="margin:0 0 20px;color:#555">Order <strong>#${data.orderNumber}</strong> is confirmed. Here's what's on the way:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:14px">
        ${row("Subtotal", formatINR(data.subtotalPaise))}
        ${data.discountPaise > 0 ? row("Discount", "−" + formatINR(data.discountPaise)) : ""}
        ${row("Shipping", data.shippingPaise > 0 ? formatINR(data.shippingPaise) : "Free")}
        ${row("Total", formatINR(data.totalPaise), true)}
      </table>
      <a href="${data.orderUrl}" style="display:inline-block;margin-top:22px;background:#111;color:#fff;text-decoration:none;padding:11px 18px;border-radius:9px;font-size:14px;font-weight:600">View order &amp; invoice</a>
    </div>

    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:22px;margin-top:16px">
      <p style="margin:0 0 6px;font-weight:600">Loved your book?</p>
      <p style="margin:0;color:#555;font-size:14px">Once it arrives, a quick review really helps other students find it — and helps us make these books better.</p>
    </div>

    <div style="text-align:center;margin-top:18px">
      <a href="${data.communityUrl}" style="color:#111;font-size:14px">Read &amp; share student writing in the Creative Corner →</a>
    </div>

    <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Vyom · Premium IBDP &amp; IGCSE Hindi study resources</p>
  </div></body></html>`;
}

/**
 * Sends the single order-confirmation email (the only scheduled email).
 * Idempotent: an atomic claim on orders.confirmation_email_sent_at means only
 * one of the two payment-success callers (webhook + inline verify) actually
 * sends. No-ops gracefully when Resend isn't configured. Never throws into the
 * payment path.
 */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // no key configured — skip silently

  const service = createServiceClient();

  // Atomically claim the send. If no row comes back, another path already did it.
  const { data: order, error: claimErr } = await service
    .from("orders")
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("confirmation_email_sent_at", null)
    .select("id, user_id, order_number, subtotal_paise, discount_paise, shipping_paise, total_paise")
    .maybeSingle();
  if (claimErr) { console.error("[email] order confirmation claim failed:", claimErr); return; }
  if (!order) return;

  const unclaim = () =>
    service.from("orders").update({ confirmation_email_sent_at: null }).eq("id", orderId);

  try {
    if (!order.user_id) return; // guest orders have no email on file
    const { data: userRes } = await service.auth.admin.getUserById(order.user_id);
    const to = userRes?.user?.email;
    if (!to) {
      await unclaim();
      return;
    }

    const { data: items } = await service
      .from("order_items")
      .select("quantity, final_price_paise, books(title)")
      .eq("order_id", orderId);

    const lineItems: LineItem[] = (items ?? []).map((it) => {
      const book = it.books as { title?: string } | { title?: string }[] | null;
      const title = Array.isArray(book) ? book[0]?.title : book?.title;
      return {
        title: title ?? "Book",
        quantity: it.quantity,
        pricePaise: it.final_price_paise,
      };
    });

    const html = buildHtml({
      orderNumber: order.order_number ?? order.id.slice(0, 8),
      items: lineItems,
      subtotalPaise: order.subtotal_paise ?? 0,
      discountPaise: order.discount_paise ?? 0,
      shippingPaise: order.shipping_paise ?? 0,
      totalPaise: order.total_paise,
      orderUrl: `${SITE_URL}/order/${orderId}/success`,
      communityUrl: `${SITE_URL}/community`,
    });

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your Vyom order #${order.order_number ?? ""} is confirmed`,
      html,
    });
    if (error) {
      console.error("[email] order confirmation send failed:", error);
      await unclaim();
    }
  } catch (e) {
    console.error("[email] order confirmation threw:", e);
    await unclaim();
  }
}
