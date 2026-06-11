"use server";

/**
 * Creative Corner — community submissions (#55, #66). Guests may submit
 * poems / stories / dramas; everything lands as `pending` and only shows
 * publicly once an admin approves it. Discriminated-union returns per
 * CLAUDE.md §4. Reads of the approved feed live in lib/queries/community.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
import { SUBMISSION_KINDS, type SubmissionKind } from "@/lib/community/constants";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const submitSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(120),
  email: z.string().trim().email("Enter a valid email so we can reach you"),
  kind: z.enum(SUBMISSION_KINDS),
  title: z.string().trim().min(1, "A title is required").max(200),
  body: z.string().trim().min(20, "Please write a little more (20+ characters)").max(20000),
});

export async function submitCommunityPost(
  raw: z.input<typeof submitSchema>,
): Promise<ActionResult> {
  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const rl = await rateLimit("community-submit", { limit: 5, windowSec: 600 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  // Session-aware client so RLS applies: signed-in users insert with their
  // own user_id, guests insert with user_id null — both forced to `pending`.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("content_submissions").insert({
    user_id: user?.id ?? null,
    submitter_name: parsed.data.name,
    submitter_email: parsed.data.email,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body,
    status: "pending",
  });
  if (error) {
    console.error("[community] submit failed:", error.message);
    return { success: false, error: "Could not submit right now. Please try again." };
  }
  return { success: true };
}

/* ============================================================
 * Admin moderation
 * ============================================================ */
async function assertAdmin(): Promise<
  { ok: true; id: string; email: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };
  if (!(await isAdminEmail(user.email))) return { ok: false, error: "Not authorised." };
  return { ok: true, id: user.id, email: user.email };
}

export interface PendingSubmission {
  id: string;
  name: string;
  email: string;
  kind: SubmissionKind;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export async function listSubmissions(
  status: "pending" | "approved" | "rejected" = "pending",
): Promise<ActionResult<PendingSubmission[]>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const service = createServiceClient();
  const { data, error } = await service
    .from("content_submissions")
    .select("id, submitter_name, submitter_email, kind, title, body, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[community] listSubmissions failed:", error.message);
    return { success: false, error: "Could not load submissions." };
  }
  return {
    success: true,
    data: (data ?? []).map((r) => ({
      id: r.id,
      name: r.submitter_name,
      email: r.submitter_email,
      kind: r.kind as SubmissionKind,
      title: r.title,
      body: r.body,
      status: r.status as PendingSubmission["status"],
      createdAt: r.created_at,
    })),
  };
}

const moderateSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().trim().max(1000).optional(),
});

export async function moderateSubmission(
  raw: z.input<typeof moderateSchema>,
): Promise<ActionResult> {
  const parsed = moderateSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid input." };
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  const { error } = await service
    .from("content_submissions")
    .update({
      status: parsed.data.decision,
      moderator_notes: parsed.data.notes ?? null,
      moderated_by: gate.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("[community] moderate failed:", error.message);
    return { success: false, error: "Could not update the submission." };
  }
  revalidatePath("/community");
  revalidatePath("/admin/community");
  return { success: true };
}
