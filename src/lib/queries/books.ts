import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type Book = Tables<"books">;

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
  return data ?? [];
}

/** Get one book by slug. Returns null if not found. */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("[books] getBookBySlug failed:", error.message);
    return null;
  }
  return data;
}

export { formatINR } from "@/lib/format";
