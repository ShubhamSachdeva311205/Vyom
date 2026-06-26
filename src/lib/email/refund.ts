import "server-only";
import { isAdminEmail } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import { formatINR } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/server";
import { EMAIL_FROM, getResend, SITE_URL } from "./client";

/**
 * Resolves the first configured admin email, env-first (ADMIN_EMAILS), then the
 * admin_emails table. Used for the operational copy of the refund notice.
 */
async function firstAdminEmail(): Promise<string | null> {
  const fromEnv = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (fromEnv) return fromEnv;

  try {
    const service = createServiceClient();
    const { data } = await service
      .from("admin_emails")
      .select("email")
      .order("added_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return (data as { email?: string } | null)?.email ?? null;
  } catch {
    return null;
  }
}

function buildCustomerHtml(data: {
  orderNumber: string;
  refundText: string;
  orderUrl: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">Vyom</div>
    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 6px">Your refund is on its way 💸</h1>
      <p style="margin:0 0 18px;color:#555">We've issued a refund of <strong>${data.refundText}</strong> for order <strong>#${data.orderNumber}</strong>.</p>
      <p style="margin:0 0 18px;color:#555;font-size:14px">Refunds typically reach your original payment method in 5–7 business days, depending on your bank.</p>
      <a href="${data.orderUrl}" style="display:inline-block;color:#111;font-size:14px">View order &amp; invoice →</a>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Questions? Just reply to this email. Vyom · IBDP &amp; IGCSE Hindi.</p>
  </div></body></html>`;
}

function buildAdminHtml(data: {
  orderNumber: string;
  refundText: string;
  customerEmail: string;
  orderUrl: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:520px;margin:0 auto;padding:24px 20px">
    <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:22px">
      <h1 style="font-size:18px;margin:0 0 10px">Refund issued — #${data.orderNumber}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 0;color:#555">Amount</td><td style="padding:4px 0;text-align:right;font-weight:600">${data.refundText}</td></tr>
        <tr><td style="padding:4px 0;color:#555">Customer</td><td style="padding:4px 0;text-align:right">${data.customerEmail}</td></tr>
      </table>
      <a href="${data.orderUrl}" style="display:inline-block;margin-top:14px;color:#111;font-size:14px">Open in admin →</a>
    </div>
  </div></body></html>`;
}

/**
 * Sends the "your refund was issued" email (#69) to the customer, plus a brief
 * operational copy to the admin. Idempotent: an atomic claim on
 * orders.refund_email_sent_at means the refund webhook and the admin refund
 * action can't double-send. Uses orders.refunded_paise for the amount. No-ops
 * when Resend isn't configured. Never throws into the refund path.
 */
export async function sendRefundEmail(orderId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // no key configured — skip silently

  const service = createServiceClient();

  // refund_email_sent_at + refunded_paise aren't in generated types yet — cast
  // the pre-check row through `unknown` and the update payload through `never`.
  const { data: pre } = await service
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  const preRow = pre as unknown as {
    refund_email_sent_at?: string | null;
    refunded_paise?: number | null;
  } | null;
  if (!pre || preRow?.refund_email_sent_at) return;

  const { data: order } = await service
    .from("orders")
    .update({ refund_email_sent_at: new Date().toISOString() } as never)
    .eq("id", orderId)
    .is("refund_email_sent_at" as never, null)
    .select("id, user_id, order_number")
    .maybeSingle();
  if (!order) return;

  const unclaim = () =>
    service
      .from("orders")
      .update({ refund_email_sent_at: null } as never)
      .eq("id", orderId);

  try {
    if (!order.user_id) return; // guest orders have no account email
    const { data: userRes } = await service.auth.admin.getUserById(order.user_id);
    const to = userRes?.user?.email;
    if (!to) {
      await unclaim();
      return;
    }

    const refundedPaise = preRow?.refunded_paise ?? 0;
    const refundText = formatINR(refundedPaise);
    const orderNumber = order.order_number ?? order.id.slice(0, 8);
    const orderUrl = `${SITE_URL}/order/${orderId}/success`;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your Vyom refund for order #${order.order_number ?? ""}`,
      html: buildCustomerHtml({ orderNumber, refundText, orderUrl }),
    });
    if (error) {
      console.error("[email] refund send failed:", error);
      await unclaim();
      return;
    }

    // Operational copy to the admin — best-effort, never unclaims the customer
    // send if it fails.
    try {
      const admin = await firstAdminEmail();
      if (admin && !(await isAdminEmail(to))) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: admin,
          subject: `Refund issued — order #${order.order_number ?? ""}`,
          html: buildAdminHtml({
            orderNumber,
            refundText,
            customerEmail: to,
            orderUrl: `${SITE_URL}/admin/orders`,
          }),
        });
      }
    } catch (e) {
      console.error("[email] refund admin copy threw:", e);
    }
  } catch (e) {
    console.error("[email] refund threw:", e);
    await unclaim();
  }
}
