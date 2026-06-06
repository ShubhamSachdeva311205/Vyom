import { type NextRequest, NextResponse } from "next/server";
import { verifyAudioTrack } from "@/lib/access/queries";
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
 * HTTP Range is forwarded to R2 natively; for the Supabase fallback we
 * slice the buffer ourselves.
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

  const range = req.headers.get("range");

  // R2 path — forward Range, stream straight through.
  if (track.bucket === "r2") {
    const obj = await getR2Object(
      process.env.R2_AUDIO_BUCKET ?? "",
      track.storageKey,
      range,
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

  // Supabase fallback — download + slice for Range.
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

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : total - 1;
    if (start >= total || end >= total || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }
    const chunk = full.subarray(start, end + 1);
    return new NextResponse(toStream(chunk), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
      },
    });
  }

  return new NextResponse(toStream(full), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(total),
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
