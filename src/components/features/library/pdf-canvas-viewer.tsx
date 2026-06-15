"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * PdfCanvasViewer — renders a watermarked PDF (from /api/protected-pdf)
 * onto a <canvas> via pdf.js. No text layer is rendered, so text can't
 * be selected or copied. Right-click is suppressed. There's no download
 * button — the bytes are watermarked per-request and never written to
 * disk by the browser (no-store).
 *
 * Anti-extraction hardening (#119), applied to PROTECTED (library) docs:
 *   - A TILED, repeated, semi-transparent identity watermark (buyer email
 *     + render timestamp) is painted over the whole page so it can't be
 *     cropped out of a screenshot. (The server also bakes in email + order
 *     number; this is a second, un-croppable layer.)
 *   - The page is blanked when the tab loses focus / is hidden, to
 *     discourage screen-share / screenshot staging.
 *   - Printing is blocked: Ctrl/Cmd+P is suppressed and a print stylesheet
 *     hides the viewer entirely.
 *
 * This is a deterrent, not DRM: a determined user can screen-record. The
 * watermark is what makes leaks traceable. We accept that trade-off.
 */
export function PdfCanvasViewer({ src, title }: { src: string; title: string }) {
  // Only paid/library docs get the heavy hardening; samples are free previews.
  const isProtected = src.includes("/api/protected-pdf");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRef = useRef<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [obscured, setObscured] = useState(false);

  // Resolve the watermark line (buyer email + render time) for protected
  // docs. Email comes from the browser session; the timestamp is the
  // current render time. The server-baked watermark already carries the
  // order number — this client layer adds an un-croppable identity tile.
  useEffect(() => {
    if (!isProtected) return;
    let cancelled = false;
    void (async () => {
      let email = "licensed copy";
      try {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        if (user?.email) email = user.email;
      } catch {
        /* fall back to generic label */
      }
      if (cancelled) return;
      const when = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      setWatermark(`${email}  ·  ${when}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [isProtected]);

  // Blank the page when the tab loses focus or is hidden (screenshot/
  // screen-share staging deterrent). Restore on focus/visibility.
  useEffect(() => {
    if (!isProtected) return;
    const hide = () => setObscured(true);
    const show = () => setObscured(false);
    const onVisibility = () =>
      document.visibilityState === "hidden" ? hide() : show();

    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isProtected]);

  // Block printing of protected docs (Ctrl/Cmd+P). The print stylesheet
  // below also hides the viewer if the print dialog is reached another way.
  useEffect(() => {
    if (!isProtected) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isProtected]);

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

  // Render the current page whenever it changes (and re-paint the tiled
  // watermark once its text resolves).
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
      if (cancelled) return;

      if (isProtected && watermark) {
        drawTiledWatermark(ctx, viewport.width, viewport.height, watermark);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, loading, watermark, isProtected]);

  if (error) {
    return <p className="text-sm text-destructive py-8 text-center">{error}</p>;
  }

  return (
    <div className="pdf-protected-viewer flex flex-col gap-3">
      {/* Print stylesheet: never let a protected doc reach paper / PDF print. */}
      {isProtected ? (
        <style>{`@media print { .pdf-protected-viewer { display: none !important; } }`}</style>
      ) : null}

      {isProtected ? (
        <p className="text-caption text-muted-foreground">
          Licensed copy — watermarked with your identity. This document is the
          owner&apos;s copyright; copying, printing, or sharing it breaches your
          purchase agreement.
        </p>
      ) : null}

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

        {/* Blank overlay when the tab is unfocused / hidden. */}
        {isProtected && obscured && !loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-md bg-background/95 text-center backdrop-blur-md">
            <EyeOff className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Hidden while this tab is inactive</p>
            <p className="text-caption text-muted-foreground">
              Return to this tab to keep reading.
            </p>
          </div>
        ) : null}
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

/**
 * Paint a tiled, rotated, low-opacity identity watermark across the whole
 * canvas so it survives cropping. Drawn in CSS-pixel space (the context is
 * pre-scaled by devicePixelRatio).
 */
function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  text: string,
): void {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#3f3f46";
  ctx.font = "13px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";

  // Rotate around the centre, then tile across the full rotated plane.
  ctx.translate(cssWidth / 2, cssHeight / 2);
  ctx.rotate(-Math.PI / 7);

  const tileWidth = ctx.measureText(text).width + 90;
  const tileHeight = 104;
  const reach = Math.ceil(Math.hypot(cssWidth, cssHeight));

  for (let y = -reach; y < reach; y += tileHeight) {
    for (let x = -reach; x < reach; x += tileWidth) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}
