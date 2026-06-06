"use server";

import { getBookSampleMeta } from "@/lib/access/queries";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface SampleItem {
  id: string;
  kind: "pdf" | "image";
}

/**
 * List a book's samples for the "View sample" dialog. Requires sign-in
 * (the bytes are gated in /api/sample too — this just gates the listing
 * so the dialog can prompt anonymous users to sign in).
 */
export async function getBookSamples(
  bookId: string,
): Promise<ActionResult<SampleItem[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please sign in to view the sample." };
  }
  const meta = await getBookSampleMeta(bookId);
  return { success: true, data: meta.map((m) => ({ id: m.id, kind: m.kind })) };
}
