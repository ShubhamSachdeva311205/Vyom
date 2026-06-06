import { type NextRequest, NextResponse } from "next/server";
import { verifyGrant } from "@/lib/access/queries";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/stream-audio?grant=<grantId>
 *
 * Proxies the audio bytes from the PRIVATE `book-audio` bucket through
 * our server so the raw storage URL never reaches the browser. Requires
 * the signed-in user to hold a live grant for the content.
 *
 * Supports HTTP Range requests so the <audio> element can seek without
 * pulling the whole file. The storage download returns the full object;
 * we slice the requested byte range out of the buffer. For our file
 * sizes (a few MB of compressed audio) buffering is fine — if files
 * grow large, swap to a signed-URL passthrough with Range forwarding.
 */
export async function GET(req: NextRequest) {
  const grantId = req.nextUrl.searchParams.get("grant");
  if (!grantId) {
    return NextResponse.json({ error: "Missing grant" }, { status: 400 });
  }

  // AuthN
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // AuthZ — live grant for this user.
  const grant = await verifyGrant(grantId, user.id);
  if (!grant || grant.contentKind !== "audio") {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }
  if (!grant.storageKey) {
    return NextResponse.json(
      { error: "Audio not uploaded yet." },
      { status: 404 },
    );
  }

  // Download from the private bucket via service role.
  const service = createServiceClient();
  const { data: blob, error } = await service.storage
    .from("book-audio")
    .download(grant.storageKey);
  if (error || !blob) {
    return NextResponse.json({ error: "Audio unavailable" }, { status: 404 });
  }

  const full = Buffer.from(await blob.arrayBuffer());
  const total = full.length;
  const contentType = blob.type || "audio/mpeg";

  // Range handling.
  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : total - 1;
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
