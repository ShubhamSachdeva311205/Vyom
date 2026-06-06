import { type NextRequest, NextResponse } from "next/server";
import { getSampleObject } from "@/lib/access/queries";
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
    sample.kind === "pdf" ? "application/pdf" : blob.type || "image/png";

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
