import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { EMAIL_FROM, getResend, SITE_URL } from "./client";

function buildHtml(title: string, url: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:20px">Advaita</div>
    <div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:28px">
      <h1 style="font-size:22px;margin:0 0 6px">It's back in stock 🎉</h1>
      <p style="margin:0 0 18px;color:#555"><strong>${title}</strong> is available again. It tends to sell out — grab it while it's here.</p>
      <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 18px;border-radius:9px;font-size:14px;font-weight:600">View the book</a>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">You're getting this because you asked to be notified. Advaita · IBDP &amp; IGCSE Hindi.</p>
  </div></body></html>`;
}

/**
 * Emails everyone on a book's back-in-stock waitlist, then stamps notified_at
 * on the ones that sent. Called when a sold-out book is restocked. No-ops
 * without Resend; failures (e.g. dev test-domain restrictions) just don't
 * stamp, so they retry next restock. Returns how many were notified.
 */
export async function notifyRestock(bookId: string): Promise<number> {
  const resend = getResend();
  if (!resend) return 0;
  const service = createServiceClient();

  const { data: waiting } = await service
    .from("stock_notifications")
    .select("id, email")
    .eq("book_id", bookId)
    .is("notified_at", null)
    .limit(500);
  if (!waiting || waiting.length === 0) return 0;

  const { data: book } = await service
    .from("books")
    .select("title, slug")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) return 0;

  const url = `${SITE_URL}/store/${book.slug}`;
  const html = buildHtml(book.title, url);
  const sentIds: string[] = [];
  for (const w of waiting) {
    try {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: w.email,
        subject: `${book.title} is back in stock`,
        html,
      });
      if (!error) sentIds.push(w.id);
      else console.error("[restock-email] send failed:", error);
    } catch (e) {
      console.error("[restock-email] threw:", e);
    }
  }
  if (sentIds.length > 0) {
    await service
      .from("stock_notifications")
      .update({ notified_at: new Date().toISOString() })
      .in("id", sentIds);
  }
  return sentIds.length;
}
