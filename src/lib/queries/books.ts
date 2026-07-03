import { createClient } from "@/lib/supabase/server";
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

/** Returns the set of book ids that have at least one sample. */
async function getSampleBookIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data } = await supabase.from("book_samples").select("book_id");
  return new Set((data ?? []).map((r) => r.book_id as string));
}

/**
 * Fetch published books. Optionally filter by curriculum.
 *
 * Server-side only — call from Server Components / Server Actions.
 * RLS automatically filters to is_active = true for anonymous reads.
 */
export async function getBooks(opts: {
  curriculum?: "ibdp" | "igcse";
} = {}): Promise<Book[]> {
  const supabase = await createClient();

  let query = supabase
    .from("books")
    .select(SAFE_BOOK_COLUMNS)
    .eq("is_active", true)
    // Soft-deleted books (admin removed via Phase 5.3 CRUD) stay in
    // the table for order-history reference but never re-appear on
    // the storefront.
    .is("deleted_at" as never, null)
    .order("curriculum", { ascending: true })
    .order("slug", { ascending: true });

  if (opts.curriculum) {
    query = query.eq("curriculum", opts.curriculum);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[books] fetch failed:", error.message);
    return [];
  }
  const sampleIds = await getSampleBookIds(supabase);
  return (data ?? []).map((b) => ({ ...b, hasSample: sampleIds.has(b.id) }));
}

/** Get one book by slug. Returns null if not found. */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select(SAFE_BOOK_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at" as never, null)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[books] getBookBySlug failed:", error.message);
    return null;
  }
  // Does this book have any samples? (drives the "View sample" button)
  const { count } = await supabase
    .from("book_samples")
    .select("id", { count: "exact", head: true })
    .eq("book_id", data.id);
  return { ...data, hasSample: (count ?? 0) > 0 };
}

export { formatINR } from "@/lib/format";
