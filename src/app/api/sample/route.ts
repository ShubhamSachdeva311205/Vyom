import { type NextRequest, NextResponse } from "next/server";
import { getSampleObject } from "@/lib/access/queries";
import { rateLimit } from "@/lib/auth/rate-limit";
import { resolveBufferRange } from "@/lib/content/audio-range";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/sample?id=<sampleId>
 *
 * Serves a book sample (preview) from the private book-samples bucket.
 * Signed-in users only — samples are a "try before you buy" perk, not
 * fully public. No watermark (they're previews, a few pages only). The
 * raw storage URL never reaches the browser.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view samples" }, { status: 401 });
  }

  const sample = await getSampleObject(id);
  if (!sample) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: blob, error } = await service.storage
    .from("book-samples")
    .download(sample.storageKey);
  if (error || !blob) {
    return NextResponse.json({ error: "Sample unavailable" }, { status: 404 });
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const contentType =
    sample.kind === "pdf"
      ? "application/pdf"
      : sample.kind === "audio"
        ? blob.type || "audio/mpeg"
        : blob.type || "image/png";

  // Audio needs HTTP Range support so the <audio> element can play/seek
  // (iOS Safari refuses to play without a 206 on a range request). To keep
  // parity with the protected stream (#119) we never return the whole body
  // in one response: a no-Range request gets a bounded initial 206 chunk,
  // every chunk is size-capped, and requests are per-IP rate limited.
  if (sample.kind === "audio") {
    const limited = await rateLimit("sample-audio", { limit: 240, windowSec: 60 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
      );
    }

    const range = req.headers.get("range");
    const total = bytes.length;
    const resolved = resolveBufferRange(range, total);
    if (resolved === "unsatisfiable") {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }
    const chunk = bytes.subarray(resolved.start, resolved.end + 1);
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${resolved.start}-${resolved.end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  }

  return new NextResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    },
  );
}
