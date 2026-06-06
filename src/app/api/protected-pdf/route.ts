import { type NextRequest, NextResponse } from "next/server";
import { verifyPdfGrant } from "@/lib/access/queries";
import { placeholderAnswerKeyPdf, watermarkPdf } from "@/lib/access/watermark";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/protected-pdf?grant=<grantId>
 *
 * Serves the answer-key PDF for a grant, watermarked per-request with
 * the buyer's email + order number. Bytes are proxied from the PRIVATE
 * `book-pdfs` bucket — the raw storage URL never reaches the browser.
 *
 * The client renders the returned bytes via pdf.js on a <canvas> (no
 * text layer, no download chrome). This route adds the identity
 * watermark so any screen-grab / re-share traces back.
 *
 * If the book's pdf file isn't uploaded yet, a placeholder PDF is
 * generated so the whole flow is testable.
 */
export async function GET(req: NextRequest) {
  const grantId = req.nextUrl.searchParams.get("grant");
  if (!grantId) {
    return NextResponse.json({ error: "Missing grant" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const grant = await verifyPdfGrant(grantId, user.id);
  if (!grant) {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }

  const downloadedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let sourceBytes: Uint8Array;
  if (grant.storageKey) {
    const service = createServiceClient();
    const { data: blob, error } = await service.storage
      .from("book-pdfs")
      .download(grant.storageKey);
    if (error || !blob) {
      return NextResponse.json({ error: "PDF unavailable" }, { status: 404 });
    }
    sourceBytes = new Uint8Array(await blob.arrayBuffer());
  } else {
    // Not uploaded yet — placeholder so the pipeline is testable.
    sourceBytes = await placeholderAnswerKeyPdf(grant.bookTitle);
  }

  let out: Uint8Array;
  try {
    out = await watermarkPdf(sourceBytes, {
      email: user.email ?? "licensed user",
      orderNumber: grant.orderNumber,
      downloadedOn,
    });
  } catch (err) {
    console.error("[protected-pdf] watermark failed:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }

  return new NextResponse(toStream(out), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(out.length),
      // inline + no-store: viewer renders it; never cached to disk.
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function toStream(buf: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(buf);
      controller.close();
    },
  });
}
