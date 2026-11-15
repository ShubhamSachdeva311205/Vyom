import { unstable_cache } from "next/cache";
import { createAnonPublicClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

// Storefront reads must NEVER pull the sensitive columns (audio_r2_key,
// pdf_r2_key = private R2 object keys; cost_paise = COGS). Column-level GRANTs
// block them at the DB, and PostgREST errors on select("*") under those grants,
// so we select the safe columns explicitly. Keep this list in sync with the
// grant in migration 20260703130000.
const SAFE_BOOK_COLUMNS =
  "id, slug, title, subtitle, description, author, isbn, curriculum, subject, price_paise, gst_class, inventory_count, cover_image_url, is_active, created_at, updated_at, has_audio, has_answer_key, discount_eligible, compare_at_price_paise, publisher, weight_grams, length_cm, breadth_cm, height_cm, hsn_sac, deleted_at, title_hindi, subtitle_hindi, description_hindi";

export type Book = Omit<
  Tables<"books">,
  "audio_r2_key" | "pdf_r2_key" | "cost_paise"
> & { hasSample?: boolean };

const fetchAllPublishedBooksCached = unstable_cache(
  async (): Promise<Book[]> => {
    const supabase = createAnonPublicClient();

    const [booksRes, samplesRes] = await Promise.all([
      supabase
        .from("books")
        .select(SAFE_BOOK_COLUMNS)
        .eq("is_active", true)
        .is("deleted_at" as never, null)
        .order("curriculum", { ascending: true })
        .order("slug", { ascending: true }),
      supabase.from("book_samples").select("book_id"),
    ]);

    if (booksRes.error) {
      console.error("[books] fetch failed:", booksRes.error.message);
      return [];
    }

    const sampleIds = new Set(
      (samplesRes.data ?? []).map((r) => r.book_id as string),
    );
    return (booksRes.data ?? []).map((b) => ({
      ...b,
      hasSample: sampleIds.has(b.id),
    }));
  },
  ["storefront-books-all"],
  { revalidate: 60, tags: ["books"] },
);

/**
 * Fetch published books. Optionally filter by curriculum.
 * Cached across requests via `unstable_cache` (60s TTL + "books" tag)
 * and fetches `books` + `book_samples` in parallel.
 */
export async function getBooks(
  opts: {
    curriculum?: "ibdp" | "igcse";
  } = {},
): Promise<Book[]> {
  const all = await fetchAllPublishedBooksCached();
  if (opts.curriculum) {
    return all.filter((b) => b.curriculum === opts.curriculum);
  }
  return all;
}

/** Get one book by slug. Returns null if not found. */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  const all = await fetchAllPublishedBooksCached();
  return all.find((b) => b.slug === slug) ?? null;
}

export { formatINR } from "@/lib/format";
