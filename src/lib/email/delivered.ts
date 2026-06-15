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
  communityUrl: string;
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
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">Advaita</div>
    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 6px">Your order was delivered 🎉</h1>
      <p style="margin:0 0 20px;color:#555">Order <strong>#${data.orderNumber}</strong> has arrived. We hope it's everything you needed.</p>
      <p style="margin:0 0 6px;color:#555;font-size:14px">What was in this parcel:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
      <a href="${data.orderUrl}" style="display:inline-block;margin-top:18px;color:#111;font-size:14px">View order &amp; invoice →</a>
    </div>

    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:22px;margin-top:16px">
      <p style="margin:0 0 6px;font-weight:600">How was it?</p>
      <p style="margin:0 0 14px;color:#555;font-size:14px">Your feedback genuinely helps other students choose — and helps us make these books better. It only takes a minute.</p>
      <a href="${data.communityUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 18px;border-radius:9px;font-size:14px;font-weight:600">Leave feedback</a>
    </div>

    <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Advaita · Premium IBDP &amp; IGCSE Hindi study resources</p>
  </div></body></html>`;
}

/**
 * Sends the "your order was delivered" email (#69). Idempotent: an atomic claim
 * on orders.delivered_email_sent_at means the two callers (admin manual
 * mark-as-delivered and the Shiprocket webhook) can't double-send. No-ops when
 * Resend isn't configured or the order has no account email (guest orders).
 * Never throws into the status path.
 */
export async function sendDeliveredEmail(orderId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // no key configured — skip silently

  const service = createServiceClient();

  // Atomically claim the send. delivered_email_sent_at isn't in generated types
  // yet (migration 20260615120000) — cast the payload through `never` and the
  // pre-check row through `unknown`, matching how shipped.ts handles its stamp.
  const { data: pre } = await service
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  const alreadySent =
    (pre as unknown as { delivered_email_sent_at?: string | null } | null)
      ?.delivered_email_sent_at ?? null;
  if (!pre || alreadySent) return;

  const { data: order } = await service
    .from("orders")
    .update({ delivered_email_sent_at: new Date().toISOString() } as never)
    .eq("id", orderId)
    .is("delivered_email_sent_at" as never, null)
    .select("id, user_id, order_number")
    .maybeSingle();
  if (!order) return;

  const unclaim = () =>
    service
      .from("orders")
      .update({ delivered_email_sent_at: null } as never)
      .eq("id", orderId);

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

    const html = buildHtml({
      orderNumber: order.order_number ?? order.id.slice(0, 8),
      items: lineItems,
      communityUrl: `${SITE_URL}/community`,
      orderUrl: `${SITE_URL}/order/${orderId}/success`,
    });

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your Advaita order #${order.order_number ?? ""} was delivered`,
      html,
    });
    if (error) {
      console.error("[email] delivered send failed:", error);
      await unclaim();
    }
  } catch (e) {
    console.error("[email] delivered threw:", e);
    await unclaim();
  }
}
