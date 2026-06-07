import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Access-grant verification helpers (Phase 4).
 *
 * Grants are per-(user, book) — owning the book unlocks ALL of its
 * digital companions (audio tracks + answer-key PDF). Audio is
 * multi-track (book_audio_tracks); the PDF is a single watermarked
 * file (books.pdf_r2_key).
 *
 * Service-role client — grant rows + storage keys must be readable
 * server-side regardless of RLS context. Ownership is checked in code
 * against a verified auth.uid().
 */

export interface AudioTrack {
  id: string;
  title: string;
}

export interface LibraryBook {
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  coverImageUrl: string | null;
  grantId: string;
  /** Audio tracks if the book has audio (empty if not uploaded yet). */
  audioTracks: AudioTrack[];
  hasAudio: boolean;
  /** Answer-key availability. */
  hasPdf: boolean;
  pdfReady: boolean;
}

/** Books the user has a live grant for, hydrated for the library. */
export async function getUserLibrary(userId: string): Promise<LibraryBook[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("access_grants")
    .select(
      `id, book_id, revoked_at,
       book:books(id, title, slug, cover_image_url, has_audio, has_answer_key, pdf_r2_key)`,
    )
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error || !data) return [];

  type Row = {
    id: string;
    book_id: string;
    book: {
      id: string;
      title: string;
      slug: string;
      cover_image_url: string | null;
      has_audio: boolean;
      has_answer_key: boolean;
      pdf_r2_key: string | null;
    } | null;
  };
  const rows = (data as unknown as Row[]).filter((r) => r.book);

  // Fetch audio tracks for books that have audio.
  const audioBookIds = rows.filter((r) => r.book!.has_audio).map((r) => r.book_id);
  const tracksByBook = new Map<string, AudioTrack[]>();
  if (audioBookIds.length > 0) {
    const { data: tracks } = await service
      .from("book_audio_tracks")
      .select("id, book_id, title, sort_order")
      .in("book_id", audioBookIds)
      .order("sort_order", { ascending: true });
    for (const t of (tracks ?? []) as Array<{ id: string; book_id: string; title: string }>) {
      const list = tracksByBook.get(t.book_id) ?? [];
      list.push({ id: t.id, title: t.title });
      tracksByBook.set(t.book_id, list);
    }
  }

  return rows.map((r) => {
    const book = r.book!;
    return {
      bookId: r.book_id,
      bookTitle: book.title,
      bookSlug: book.slug,
      coverImageUrl: book.cover_image_url,
      grantId: r.id,
      hasAudio: book.has_audio,
      audioTracks: tracksByBook.get(r.book_id) ?? [],
      hasPdf: book.has_answer_key,
      pdfReady: Boolean(book.pdf_r2_key),
    };
  });
}

/** Set of book ids the user holds a live grant for — used to unlock the
 *  Audio / Answer-key tabs on /ibdp + /igcse. */
export async function getUserGrantedBookIds(userId: string): Promise<Set<string>> {
  const service = createServiceClient();
  const { data } = await service
    .from("access_grants")
    .select("book_id")
    .eq("user_id", userId)
    .is("revoked_at", null);
  return new Set((data ?? []).map((r) => r.book_id as string));
}

/* ============================================================
 * verifyPdfGrant — for /api/protected-pdf. Confirms a live grant for
 * the book behind this grant id, returns the pdf storage location.
 * ============================================================ */
export interface VerifiedPdf {
  storageKey: string | null;
  bookTitle: string;
  orderNumber: string | null;
}

export async function verifyPdfGrant(
  grantId: string,
  userId: string,
): Promise<VerifiedPdf | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("access_grants")
    .select(
      `user_id, revoked_at, order_id,
       book:books(title, has_answer_key, pdf_r2_key)`,
    )
    .eq("id", grantId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as {
    user_id: string;
    revoked_at: string | null;
    order_id: string | null;
    book: { title: string; has_answer_key: boolean; pdf_r2_key: string | null } | null;
  };
  if (row.user_id !== userId || row.revoked_at || !row.book || !row.book.has_answer_key) {
    return null;
  }

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
    storageKey: row.book.pdf_r2_key,
    bookTitle: row.book.title,
    orderNumber,
  };
}

/* ============================================================
 * verifyAudioTrack — for /api/stream-audio. Confirms the user holds a
 * live grant for the track's book, returns where the file lives.
 * ============================================================ */
export interface VerifiedTrack {
  bucket: string; // 'r2' | 'supabase'
  storageKey: string;
  title: string;
}

export async function verifyAudioTrack(
  trackId: string,
  userId: string,
): Promise<VerifiedTrack | null> {
  const service = createServiceClient();
  const { data: track } = await service
    .from("book_audio_tracks")
    .select("book_id, title, storage_key, bucket")
    .eq("id", trackId)
    .maybeSingle();
  if (!track) return null;

  const t = track as unknown as {
    book_id: string;
    title: string;
    storage_key: string;
    bucket: string;
  };

  const { data: grant } = await service
    .from("access_grants")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", t.book_id)
    .is("revoked_at", null)
    .maybeSingle();
  if (!grant) return null;

  return { bucket: t.bucket, storageKey: t.storage_key, title: t.title };
}

/* ============================================================
 * Samples — metadata for the storefront button + byte resolution.
 * ============================================================ */
export interface BookSample {
  id: string;
  kind: "pdf" | "image";
  sortOrder: number;
}

export async function getBookSampleMeta(bookId: string): Promise<BookSample[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("book_samples")
    .select("id, kind, sort_order")
    .eq("book_id", bookId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((s) => ({
    id: s.id,
    kind: s.kind as "pdf" | "image",
    sortOrder: s.sort_order,
  }));
}

export async function getSampleObject(
  sampleId: string,
): Promise<{ storageKey: string; kind: "pdf" | "image" } | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("book_samples")
    .select("storage_key, kind")
    .eq("id", sampleId)
    .maybeSingle();
  if (!data) return null;
  return { storageKey: data.storage_key, kind: data.kind as "pdf" | "image" };
}
