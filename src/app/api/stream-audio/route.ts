import { type NextRequest, NextResponse } from "next/server";
import { verifyAudioTrack } from "@/lib/access/queries";
import { rateLimit } from "@/lib/auth/rate-limit";
import { boundedR2Range, resolveBufferRange } from "@/lib/content/audio-range";
import { getR2Object } from "@/lib/r2/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/stream-audio?track=<trackId>
 *
 * Streams one audio track. Requires the signed-in user to hold a live
 * audio grant for the track's book. The file lives in R2 (default, free
 * egress) or Supabase Storage (`bucket` column = 'supabase', used for
 * local testing before R2 creds are set). Either way the raw object URL
 * never reaches the browser — we proxy the bytes.
 *
 * Anti-rip (#119): we NEVER return the whole file body in one response.
 * A no-Range request gets a bounded initial 206 chunk (+ Accept-Ranges)
 * so the player must seek the rest; every served chunk is size-capped;
 * and requests are per-IP rate limited so a script can't hammer/rip
 * rapidly. iOS/Safari keep working — they range-request and accept 206.
 */
export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get("track");
  if (!trackId) {
    return NextResponse.json({ error: "Missing track" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const track = await verifyAudioTrack(trackId, user.id);
  if (!track) {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }

  // Per-IP throttle on audio segment requests. Generous enough for normal
  // playback + seeking (chunks are ≤1 MB), tight enough to stop a scripted
  // ripper from pulling many files fast.
  const limited = await rateLimit("stream-audio", { limit: 240, windowSec: 60 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const range = req.headers.get("range");

  // R2 path — forward a BOUNDED Range so the response is always partial.
  if (track.bucket === "r2") {
    const obj = await getR2Object(
      process.env.R2_AUDIO_BUCKET ?? "",
      track.storageKey,
      boundedR2Range(range),
    );
    if (!obj) {
      return NextResponse.json({ error: "Audio unavailable" }, { status: 404 });
    }
    const headers: Record<string, string> = {
      "Content-Type": obj.contentType || "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    };
    if (obj.contentLength) headers["Content-Length"] = String(obj.contentLength);
    if (obj.contentRange) headers["Content-Range"] = obj.contentRange;
    return new NextResponse(obj.body, { status: obj.status, headers });
  }

  // Supabase fallback — download + slice to a bounded range.
  const service = createServiceClient();
  const { data: blob, error } = await service.storage
    .from("book-audio")
    .download(track.storageKey);
  if (error || !blob) {
    return NextResponse.json({ error: "Audio unavailable" }, { status: 404 });
  }
  const full = Buffer.from(await blob.arrayBuffer());
  const total = full.length;
  const contentType = blob.type || "audio/mpeg";

  const resolved = resolveBufferRange(range, total);
  if (resolved === "unsatisfiable") {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }

  const chunk = full.subarray(resolved.start, resolved.end + 1);
  return new NextResponse(toStream(chunk), {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${resolved.start}-${resolved.end}/${total}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}

function toStream(buf: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buf));
      controller.close();
    },
  });
}
