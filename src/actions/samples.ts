"use server";

import { getBookSampleMeta } from "@/lib/access/queries";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: "auth" };

export interface SampleItem {
  id: string;
  kind: "pdf" | "image" | "audio";
}

/**
 * List a book's samples for the "View sample" dialog. Requires sign-in
 * (the bytes are gated in /api/sample too). When the visitor isn't
 * signed in we return code:"auth" so the dialog can show a friendly
 * sign-in prompt instead of a raw error.
 */
export async function getBookSamples(
  bookId: string,
): Promise<ActionResult<SampleItem[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please sign in to view the sample.", code: "auth" };
  }
  const meta = await getBookSampleMeta(bookId);
  return { success: true, data: meta.map((m) => ({ id: m.id, kind: m.kind })) };
}
