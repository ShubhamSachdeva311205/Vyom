"use server";

/**
 * Product reviews (#53 / Phase-10 reviews). Public star-rating reviews per
 * book, moderated: guests submit → `pending`, only approved show on the PDP.
 * Reads (approved + average) live in lib/queries/reviews.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const submitSchema = z.object({
  bookId: z.string().uuid(),
  name: z.string().trim().min(1, "Your name is required").max(120),
  rating: z.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(10, "Please write a little more").max(5000),
});

export async function submitReview(
  raw: z.input<typeof submitSchema>,
): Promise<ActionResult> {
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const rl = await rateLimit("review-submit", { limit: 6, windowSec: 600 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("book_reviews").insert({
    book_id: parsed.data.bookId,
    user_id: user?.id ?? null,
    reviewer_name: parsed.data.name,
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    status: "pending",
  });
  if (error) {
    console.error("[reviews] submit failed:", error.message);
    return { success: false, error: "Could not submit your review. Please try again." };
  }
  return { success: true };
}

/* ============================================================
 * Admin moderation
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

export interface AdminReview {
  id: string;
  bookId: string;
  bookTitle: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export async function listReviews(
  status: "pending" | "approved" | "rejected" = "pending",
): Promise<ActionResult<AdminReview[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const service = createServiceClient();
  const { data, error } = await service
    .from("book_reviews")
    .select("id, book_id, rating, title, body, status, reviewer_name, created_at, books(title)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[reviews] listReviews failed:", error.message);
    return { success: false, error: "Could not load reviews." };
  }
  return {
    success: true,
    data: (data ?? []).map((r) => {
      const book = r.books as { title?: string } | { title?: string }[] | null;
      const bookTitle = Array.isArray(book) ? book[0]?.title : book?.title;
      return {
        id: r.id,
        bookId: r.book_id,
        bookTitle: bookTitle ?? "—",
        name: r.reviewer_name,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status as AdminReview["status"],
        createdAt: r.created_at,
      };
    }),
  };
}

const moderateSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function moderateReview(
  raw: z.input<typeof moderateSchema>,
): Promise<ActionResult> {
  const parsed = moderateSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service
    .from("book_reviews")
    .update({
      status: parsed.data.decision,
      moderated_by: gate.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[reviews] moderate failed:", error.message);
    return { success: false, error: "Could not update the review." };
  }
  revalidatePath("/admin/community");
  return { success: true };
}
