"use server";

/**
 * Feedback (#56, #67). A private line to the admin — general (on /community)
 * or tagged to a book (on the PDP via book_id). Never shown publicly; only
 * admins read it (feedback_admin_all RLS). Guests welcome.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { grantFeedbackReward } from "@/lib/coupons/reward";
import { FEEDBACK_KINDS } from "@/lib/feedback/constants";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const submitSchema = z.object({
  kind: z.enum(FEEDBACK_KINDS),
  body: z.string().trim().min(5, "Please add a little detail").max(5000),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  bookId: z.string().uuid().optional(),
});

export async function submitFeedback(
  raw: z.input<typeof submitSchema>,
): Promise<ActionResult<{ rewardCode: string | null }>> {
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const rl = await rateLimit("feedback-submit", { limit: 6, windowSec: 600 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    submitter_name: parsed.data.name || null,
    submitter_email: parsed.data.email || null,
    kind: parsed.data.kind,
    body: parsed.data.body,
    book_id: parsed.data.bookId ?? null,
    resolved: false,
  });
  if (error) {
    console.error("[feedback] submit failed:", error.message);
    return { success: false, error: "Could not send your feedback. Please try again." };
  }

  // Reward: signed-in customers get a single-use 15%-off coupon on-screen
  // (#69). Idempotent per user. Guests get nothing (we can't dedupe them).
  const rewardCode = user ? await grantFeedbackReward(user.id) : null;
  return { success: true, data: { rewardCode } };
}

/* ============================================================
 * Admin inbox
 * ============================================================ */
async function assertAdmin(): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };
  if (!(await isAdminEmail(user.email))) return { ok: false, error: "Not authorised." };
  return { ok: true, id: user.id };
}

export interface FeedbackRow {
  id: string;
  kind: string;
  body: string;
  name: string | null;
  email: string | null;
  bookTitle: string | null;
  resolved: boolean;
  createdAt: string;
}

export async function listFeedback(
  filter: "open" | "resolved" | "all" = "open",
): Promise<ActionResult<FeedbackRow[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const service = createServiceClient();
  let query = service
    .from("feedback")
    .select("id, kind, body, submitter_name, submitter_email, resolved, created_at, books(title)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter === "open") query = query.eq("resolved", false);
  else if (filter === "resolved") query = query.eq("resolved", true);

  const { data, error } = await query;
  if (error) {
    console.error("[feedback] listFeedback failed:", error.message);
    return { success: false, error: "Could not load feedback." };
  }
  return {
    success: true,
    data: (data ?? []).map((r) => {
      const book = r.books as { title?: string } | { title?: string }[] | null;
      const bookTitle = Array.isArray(book) ? book[0]?.title : book?.title;
      return {
        id: r.id,
        kind: r.kind,
        body: r.body,
        name: r.submitter_name,
        email: r.submitter_email,
        bookTitle: bookTitle ?? null,
        resolved: r.resolved,
        createdAt: r.created_at,
      };
    }),
  };
}

const resolveSchema = z.object({
  id: z.string().uuid(),
  resolved: z.boolean(),
});

export async function resolveFeedback(
  raw: z.input<typeof resolveSchema>,
): Promise<ActionResult> {
  const parsed = resolveSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service
    .from("feedback")
    .update({
      resolved: parsed.data.resolved,
      resolved_by: parsed.data.resolved ? gate.id : null,
      resolved_at: parsed.data.resolved ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[feedback] resolve failed:", error.message);
    return { success: false, error: "Could not update the feedback." };
  }
  revalidatePath("/admin/feedback");
  return { success: true };
}
