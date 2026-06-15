import "server-only";
import { env } from "@/lib/env";
import { FEEDBACK_KIND_LABELS, type FeedbackKind } from "@/lib/feedback/constants";
import { createServiceClient } from "@/lib/supabase/server";
import { EMAIL_FROM, getResend, SITE_URL } from "./client";

/**
 * Resolves the first configured admin email, env-first (ADMIN_EMAILS), then the
 * admin_emails table. This is where the feedback alert lands.
 */
async function firstAdminEmail(service: ReturnType<typeof createServiceClient>): Promise<string | null> {
  const fromEnv = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (fromEnv) return fromEnv;

  try {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(data: {
  kindLabel: string;
  snippet: string;
  bookTitle: string | null;
  submitter: string;
  inboxUrl: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:520px;margin:0 auto;padding:24px 20px">
    <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:22px">
      <h1 style="font-size:18px;margin:0 0 10px">New feedback — ${escapeHtml(data.kindLabel)}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:14px">
        <tr><td style="padding:4px 0;color:#555">From</td><td style="padding:4px 0;text-align:right">${escapeHtml(data.submitter)}</td></tr>
        ${data.bookTitle ? `<tr><td style="padding:4px 0;color:#555">Book</td><td style="padding:4px 0;text-align:right">${escapeHtml(data.bookTitle)}</td></tr>` : ""}
      </table>
      <div style="background:#f6f6f4;border-radius:9px;padding:14px;color:#333;font-size:14px;line-height:1.5">${escapeHtml(data.snippet)}</div>
      <a href="${data.inboxUrl}" style="display:inline-block;margin-top:14px;color:#111;font-size:14px">Open the feedback inbox →</a>
    </div>
  </div></body></html>`;
}

/**
 * Fire-and-forget admin alert when new feedback is submitted (#69). Best-effort:
 * no idempotency column — at most one alert per submission because the caller
 * fires it once. No-ops when Resend isn't configured or no admin email resolves.
 * Never throws into the submit action.
 */
export async function sendFeedbackAlert(feedbackId: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // no key configured — skip silently

  try {
    const service = createServiceClient();

    const { data: fb } = await service
      .from("feedback")
      .select("kind, body, submitter_name, submitter_email, books(title)")
      .eq("id", feedbackId)
      .maybeSingle();
    if (!fb) return;

    const to = await firstAdminEmail(service);
    if (!to) return;

    const book = fb.books as { title?: string } | { title?: string }[] | null;
    const bookTitle = (Array.isArray(book) ? book[0]?.title : book?.title) ?? null;

    const kindLabel =
      FEEDBACK_KIND_LABELS[fb.kind as FeedbackKind] ?? fb.kind;
    const body = fb.body ?? "";
    const snippet = body.length > 280 ? `${body.slice(0, 280)}…` : body;
    const submitter =
      fb.submitter_name?.trim() ||
      fb.submitter_email?.trim() ||
      "Anonymous";

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `New feedback: ${kindLabel}`,
      html: buildHtml({
        kindLabel,
        snippet,
        bookTitle,
        submitter,
        inboxUrl: `${SITE_URL}/admin/feedback`,
      }),
    });
    if (error) console.error("[email] feedback alert send failed:", error);
  } catch (e) {
    console.error("[email] feedback alert threw:", e);
  }
}
