"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PdfCanvasViewer — renders a watermarked PDF (from /api/protected-pdf)
 * onto a <canvas> via pdf.js. No text layer is rendered, so text can't
 * be selected or copied. Right-click is suppressed. There's no download
 * button — the bytes are watermarked per-request and never written to
 * disk by the browser (no-store).
 *
 * This is a deterrent, not DRM: a determined user can screen-record.
 * The watermark is what makes leaks traceable. We accept that trade-off.
 */
export function PdfCanvasViewer({ src, title }: { src: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRef = useRef<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the document once.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // setState inside the async callback (not directly in the effect
      // body) so React 19's set-state-in-effect rule is satisfied.
      setLoading(true);
      setError(null);
      try {
        const pdfjs = await import("pdfjs-dist");
        // Worker hosted from the same package; Turbopack resolves the URL.
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({ url: src, withCredentials: true });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setPage(1);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[pdf-viewer] load failed:", err);
        setError("Couldn't open this document.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (docRef.current) {
        try {
          docRef.current.destroy?.();
        } catch {
          /* noop */
        }
        docRef.current = null;
      }
    };
  }, [src]);

  // Render the current page whenever it changes.
  useEffect(() => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || loading) return;

    let cancelled = false;
    void (async () => {
      const pageObj = await doc.getPage(page);
      if (cancelled) return;
      const containerWidth = canvas.parentElement?.clientWidth ?? 800;
      const baseViewport = pageObj.getViewport({ scale: 1 });
      const scale = Math.min(2, containerWidth / baseViewport.width);
      const viewport = pageObj.getViewport({ scale });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      await pageObj.render({ canvasContext: ctx, viewport }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [page, loading]);

  if (error) {
    return <p className="text-sm text-destructive py-8 text-center">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative w-full overflow-auto rounded-md border border-border bg-muted/30 flex justify-center p-3"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none" }}
      >
        {loading ? (
          <div className="py-20 inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Loading {title}…
          </div>
        ) : (
          <canvas ref={canvasRef} className="max-w-full shadow-sm" />
        )}
      </div>

      {numPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Prev
          </Button>
          <span className="text-caption text-muted-foreground tabular-nums">
            Page {page} of {numPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
