"use server";

/**
 * Admin Access-Grant management — Phase 4 / Issue #65.
 *
 * Manual grants for offline / Amazon buyers, revocation, and per-customer
 * grant lookup. The grant/revoke mutations go through SECURITY DEFINER
 * RPCs (grant_access_manual, revoke_access) which re-check is_admin()
 * and write admin_audit_logs.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function assertAdmin(): Promise<
  | { ok: true; email: string; id: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.email) return { ok: false, error: "Not signed in." };
  if (!(await isAdminEmail(user.email))) return { ok: false, error: "Not authorised." };
  return { ok: true, email: user.email, id: user.id };
}

export interface AdminGrantRow {
  id: string;
  email: string;
  bookTitle: string;
  source: string;
  grantedAt: string;
  revokedAt: string | null;
}

/* ============================================================
 * Search grants by customer email.
 * ============================================================ */
const searchInput = z.object({ email: z.string().trim().min(1).max(200) });

export async function searchGrantsByEmail(
  input: z.input<typeof searchInput>,
): Promise<ActionResult<AdminGrantRow[]>> {
  const parsed = searchInput.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter an email to search." };
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const service = createServiceClient();
  // Resolve the email → user_id first.
  const { data: targetUser } = await service
    .from("users")
    .select("id")
    .ilike("email", parsed.data.email)
    .maybeSingle();
  if (!targetUser) {
    return { success: true, data: [] };
  }

  const { data, error } = await service
    .from("access_grants")
    .select(
      `id, source, created_at, revoked_at,
       user:users(email), book:books(title)`,
    )
    .eq("user_id", targetUser.id)
    .order("created_at", { ascending: false });
  if (error) return { success: false, error: error.message };

  type Row = {
    id: string;
    source: string;
    created_at: string;
    revoked_at: string | null;
    user: { email: string } | null;
    book: { title: string } | null;
  };
  const rows: AdminGrantRow[] = (data as unknown as Row[]).map((r) => ({
    id: r.id,
    email: r.user?.email ?? parsed.data.email,
    bookTitle: r.book?.title ?? "—",
    source: r.source,
    grantedAt: r.created_at,
    revokedAt: r.revoked_at,
  }));
  return { success: true, data: rows };
}

/* ============================================================
 * Manual grant.
 * ============================================================ */
const grantInput = z.object({
  email: z.string().email(),
  bookId: z.string().uuid(),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function grantAccessManual(
  input: z.input<typeof grantInput>,
): Promise<ActionResult> {
  const parsed = grantInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  // Call via the AUTHENTICATED client (not service-role): the RPC checks
  // is_admin() internally, which reads auth.uid() — null under service-role.
  // The action is already admin-gated by assertAdmin() above (#128).
  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_access_manual" as never, {
    p_email: parsed.data.email,
    p_book_id: parsed.data.bookId,
    p_notes: parsed.data.notes || null,
  } as never);
  if (error) {
    // RPC raises 'no account found for ...' — surface it cleanly.
    return { success: false, error: error.message.replace(/^.*?:\s*/, "") };
  }
  revalidatePath("/admin/access-grants");
  return { success: true };
}

/* ============================================================
 * Revoke.
 * ============================================================ */
export async function revokeAccessGrant(
  input: { grantId: string },
): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(input.grantId).success) {
    return { success: false, error: "Invalid grant id." };
  }
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  // Authenticated client so the RPC's is_admin() check sees the admin's
  // auth.uid() (service-role would be null → "caller is not admin"). #128
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_access" as never, {
    p_grant_id: input.grantId,
  } as never);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/access-grants");
  return { success: true };
}

/* ============================================================
 * Book list for the grant form's book picker.
 * ============================================================ */
export async function listBooksForGrantPicker(): Promise<
  ActionResult<Array<{ id: string; title: string; hasAudio: boolean; hasAnswerKey: boolean }>>
> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, has_audio, has_answer_key")
    .is("deleted_at" as never, null)
    .order("title", { ascending: true });
  if (error) return { success: false, error: error.message };
  return {
    success: true,
    data: (data ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      hasAudio: b.has_audio,
      hasAnswerKey: b.has_answer_key,
    })),
  };
}

/* ============================================================
 * Upload a book's companion file (audio / pdf) to its private bucket
 * and stamp the storage key on the book row.
 * ============================================================ */
export async function uploadBookContent(
  formData: FormData,
): Promise<ActionResult<{ key: string }>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const file = formData.get("file");
  const bookId = (formData.get("bookId")?.toString() ?? "").trim();
  const slug = (formData.get("slug")?.toString() ?? "").trim();
  const kind = formData.get("kind")?.toString();

  if (!(file instanceof File)) return { success: false, error: "No file uploaded." };
  if (!z.string().uuid().safeParse(bookId).success) {
    return { success: false, error: "Invalid book id." };
  }
  if (kind !== "audio" && kind !== "pdf") {
    return { success: false, error: "Invalid content kind." };
  }

  const isAudio = kind === "audio";
  const bucket = isAudio ? "book-audio" : "book-pdfs";
  const maxBytes = isAudio ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { success: false, error: `File too large (max ${isAudio ? "100" : "50"}MB).` };
  }
  const okMime = isAudio
    ? file.type.startsWith("audio/")
    : file.type === "application/pdf";
  if (!okMime) {
    return {
      success: false,
      error: isAudio ? "Must be an audio file." : "Must be a PDF.",
    };
  }

  const ext = isAudio ? (file.type.split("/")[1] || "mp3") : "pdf";
  const key = `${slug || bookId}.${ext}`;

  const service = createServiceClient();
  const { error: upErr } = await service.storage.from(bucket).upload(key, file, {
    upsert: true,
    contentType: file.type,
  });
  if (upErr) return { success: false, error: upErr.message };

  const col = isAudio ? "audio_r2_key" : "pdf_r2_key";
  const { error: dbErr } = await service
    .from("books")
    .update({ [col]: key } as never)
    .eq("id", bookId);
  if (dbErr) return { success: false, error: dbErr.message };

  await service.from("admin_audit_logs").insert({
    admin_id: gate.id,
    admin_email: gate.email,
    action: isAudio ? "book.upload_audio" : "book.upload_pdf",
    target_table: "books",
    target_id: bookId,
    details: { key },
  });

  revalidatePath("/admin/inventory");
  return { success: true, data: { key } };
}
