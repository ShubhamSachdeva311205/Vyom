import { createClient } from "@/lib/supabase/server";

export interface ApprovedSubmission {
  id: string;
  name: string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
}

/**
 * Public Creative Corner feed — approved submissions only. RLS
 * (content_submissions_public_select_approved) enforces the filter even
 * though we also pass .eq("status","approved"); submitter_email is never
 * selected so it can't leak into the public feed.
 */
export async function getApprovedSubmissions(): Promise<ApprovedSubmission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_submissions")
    .select("id, submitter_name, kind, title, body, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.submitter_name,
    kind: r.kind,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
  }));
}
