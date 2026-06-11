import { createClient } from "@/lib/supabase/server";

export interface PublicReview {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}

export interface BookReviewSummary {
  reviews: PublicReview[];
  avg: number;
  count: number;
}

/**
 * Approved reviews for a book + their average + count. RLS
 * (book_reviews_public_select_approved) guarantees only approved rows are
 * returned; reviewer email is never stored, so nothing private leaks.
 * Capped at 100 — ample for a small catalog; revisit with pagination if a
 * book ever exceeds it.
 */
export async function getBookReviews(bookId: string): Promise<BookReviewSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("book_reviews")
    .select("id, reviewer_name, rating, title, body, created_at")
    .eq("book_id", bookId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviews: PublicReview[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
  }));
  const count = reviews.length;
  const avg = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  return { reviews, avg, count };
}
