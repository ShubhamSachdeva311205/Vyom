import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Book = Tables<"books"> & { hasSample?: boolean };

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
    .select("*")
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
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at" as never, null)
    .maybeSingle();
  if (error) {
    console.error("[books] getBookBySlug failed:", error.message);
    return null;
  }
  return data;
}

export { formatINR } from "@/lib/format";
