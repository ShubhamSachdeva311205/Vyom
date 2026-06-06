import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Access-grant verification helpers (Phase 4).
 *
 * The API routes (/api/stream-audio, /api/protected-pdf) and the
 * /dashboard/library page use these to check a user holds a live grant
 * for a piece of content before any bytes are served.
 *
 * Service-role client: grant rows + storage keys must be readable
 * server-side regardless of the caller's RLS context. The user-id
 * ownership check is done in code (the caller passes a verified
 * auth.uid()).
 */

export type ContentKind = "audio" | "pdf";

export interface LibraryGrant {
  grantId: string;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  coverImageUrl: string | null;
  contentKind: ContentKind;
  /** Storage object key in the private bucket; null = file not uploaded yet. */
  storageKey: string | null;
  source: string;
  grantedAt: string;
}

/** All live (non-revoked) grants for a user, hydrated for the library UI. */
export async function getUserLibrary(userId: string): Promise<LibraryGrant[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("access_grants")
    .select(
      `id, book_id, content_kind, source, granted_at, revoked_at,
       book:books(id, title, slug, cover_image_url, audio_r2_key, pdf_r2_key)`,
    )
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false });
  if (error || !data) return [];

  type Row = {
    id: string;
    book_id: string;
    content_kind: ContentKind;
    source: string;
    granted_at: string;
    book: {
      id: string;
      title: string;
      slug: string;
      cover_image_url: string | null;
      audio_r2_key: string | null;
      pdf_r2_key: string | null;
    } | null;
  };

  return (data as unknown as Row[])
    .filter((r) => r.book)
    .map((r) => ({
      grantId: r.id,
      bookId: r.book_id,
      bookTitle: r.book!.title,
      bookSlug: r.book!.slug,
      coverImageUrl: r.book!.cover_image_url,
      contentKind: r.content_kind,
      storageKey:
        r.content_kind === "audio" ? r.book!.audio_r2_key : r.book!.pdf_r2_key,
      source: r.source,
      grantedAt: r.granted_at,
    }));
}

export interface VerifiedGrant {
  bucket: "book-audio" | "book-pdfs";
  storageKey: string | null;
  contentKind: ContentKind;
  bookTitle: string;
  orderNumber: string | null;
}

/**
 * Verify a user holds a live grant identified by grantId, and return
 * the storage location + display metadata. Returns null when the grant
 * doesn't exist, is revoked, or belongs to a different user.
 */
export async function verifyGrant(
  grantId: string,
  userId: string,
): Promise<VerifiedGrant | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("access_grants")
    .select(
      `id, user_id, content_kind, revoked_at, order_id,
       book:books(title, audio_r2_key, pdf_r2_key)`,
    )
    .eq("id", grantId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as {
    user_id: string;
    content_kind: ContentKind;
    revoked_at: string | null;
    order_id: string | null;
    book: {
      title: string;
      audio_r2_key: string | null;
      pdf_r2_key: string | null;
    } | null;
  };

  if (row.user_id !== userId) return null;
  if (row.revoked_at) return null;
  if (!row.book) return null;

  // Resolve the order number for the watermark (best-effort).
  let orderNumber: string | null = null;
  if (row.order_id) {
    const { data: order } = await service
      .from("orders")
      .select("order_number")
      .eq("id", row.order_id)
      .maybeSingle();
    orderNumber = order?.order_number ?? null;
  }

  return {
    bucket: row.content_kind === "audio" ? "book-audio" : "book-pdfs",
    storageKey:
      row.content_kind === "audio" ? row.book.audio_r2_key : row.book.pdf_r2_key,
    contentKind: row.content_kind,
    bookTitle: row.book.title,
    orderNumber,
  };
}
