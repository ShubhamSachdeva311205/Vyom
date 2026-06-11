"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { getBookSamples, type SampleItem } from "@/actions/samples";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stack } from "@/components/layouts/stack";

// Reuse the canvas PDF viewer (no download / no text select) for PDF samples.
const PdfCanvasViewer = dynamic(
  () => import("@/components/features/library/pdf-canvas-viewer").then((m) => m.PdfCanvasViewer),
  {
    ssr: false,
    loading: () => (
      <div className="py-16 inline-flex items-center gap-2 text-muted-foreground justify-center w-full">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        Loading sample…
      </div>
    ),
  },
);

/**
 * "View sample" button shown beside Add to cart. Samples are signed-in
 * only — clicking fetches the book's sample list (server action gates on
 * auth) and opens a dialog. PDFs render in the canvas viewer; image
 * samples render as a gallery. Bytes come from /api/sample (also auth-
 * gated). Only rendered when the book actually has samples.
 */
export function ViewSampleButton({
  bookId,
  bookTitle,
  block = false,
}: {
  bookId: string;
  bookTitle: string;
  block?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [samples, setSamples] = useState<SampleItem[] | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();

  function onOpen() {
    setOpen(true);
    setNeedsAuth(false);
    if (samples) return;
    startTransition(async () => {
      const result = await getBookSamples(bookId);
      if (!result.success) {
        if (result.code === "auth") {
          // Keep the dialog open and show a sign-in prompt inside it.
          setNeedsAuth(true);
          return;
        }
        toast.error(result.error);
        setOpen(false);
        return;
      }
      if (result.data.length === 0) {
        toast.message("No sample available for this book yet.");
        setOpen(false);
        return;
      }
      setSamples(result.data);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpen}
        className={block ? "w-full" : undefined}
      >
        <Eye className="size-4" aria-hidden="true" />
        View sample
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{bookTitle} — Sample</DialogTitle>
          </DialogHeader>
          {needsAuth ? (
            <Stack gap={4} className="py-8 items-center text-center">
              <p className="text-body text-muted-foreground max-w-sm">
                Samples are for signed-in readers. Sign in (or create a free
                account) to preview this book before buying.
              </p>
              <Button asChild>
                <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>
                  <LogIn className="size-4" aria-hidden="true" />
                  Sign in to view sample
                </Link>
              </Button>
            </Stack>
          ) : pending || !samples ? (
            <div className="py-16 inline-flex items-center gap-2 text-muted-foreground justify-center w-full">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Loading sample…
            </div>
          ) : (
            <Stack gap={4}>
              {samples.map((s) =>
                s.kind === "pdf" ? (
                  <PdfCanvasViewer
                    key={s.id}
                    src={`/api/sample?id=${s.id}`}
                    title="sample"
                  />
                ) : s.kind === "audio" ? (
                  <div
                    key={s.id}
                    className="rounded-md border border-border bg-muted/30 p-4"
                  >
                    <p className="text-caption text-muted-foreground mb-2">
                      Listening sample
                    </p>
                    <audio
                      controls
                      controlsList="nodownload"
                      preload="metadata"
                      className="w-full"
                      onContextMenu={(e) => e.preventDefault()}
                      src={`/api/sample?id=${s.id}`}
                    >
                      Your browser doesn&rsquo;t support audio playback.
                    </audio>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={s.id}
                    src={`/api/sample?id=${s.id}`}
                    alt="Sample page"
                    className="w-full rounded-md border border-border"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ),
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
