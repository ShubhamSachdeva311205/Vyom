"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Headphones, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stack, Row } from "@/components/layouts/stack";

// pdf.js viewer is heavy + browser-only — load it lazily, no SSR.
const PdfCanvasViewer = dynamic(
  () => import("./pdf-canvas-viewer").then((m) => m.PdfCanvasViewer),
  {
    ssr: false,
    loading: () => (
      <div className="py-20 inline-flex items-center gap-2 text-muted-foreground justify-center w-full">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        Loading viewer…
      </div>
    ),
  },
);

export interface LibraryBookGroup {
  bookId: string;
  bookTitle: string;
  coverImageUrl: string | null;
  bookSlug: string;
  audioGrantId: string | null;
  audioReady: boolean;
  pdfGrantId: string | null;
  pdfReady: boolean;
}

export function LibraryBookCard({ group }: { group: LibraryBookGroup }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const coverSrc = group.coverImageUrl ?? `/book-covers/${group.bookSlug}.webp`;

  return (
    <Card variant="surface" padding="lg">
      <Row gap={4} align="start" className="flex-wrap">
        <div className="size-20 rounded-md bg-muted overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt="" className="size-full object-cover" />
        </div>
        <Stack gap={3} className="flex-1 min-w-[220px]">
          <p className="text-base font-medium">{group.bookTitle}</p>

          {group.audioGrantId ? (
            <Stack gap={2}>
              <Row gap={2} align="center" className="text-caption text-muted-foreground">
                <Headphones className="size-4" aria-hidden="true" />
                Listening audio
              </Row>
              {group.audioReady ? (
                <audio
                  controls
                  controlsList="nodownload noplaybackrate"
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full"
                  src={`/api/stream-audio?grant=${group.audioGrantId}`}
                >
                  Your browser doesn&apos;t support audio playback.
                </audio>
              ) : (
                <p className="text-caption text-muted-foreground">
                  Audio is being prepared — it&apos;ll appear here once uploaded.
                </p>
              )}
            </Stack>
          ) : null}

          {group.pdfGrantId ? (
            <Stack gap={2}>
              <Row gap={2} align="center" className="text-caption text-muted-foreground">
                <FileText className="size-4" aria-hidden="true" />
                Answer key
              </Row>
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
                  <FileText className="size-4" aria-hidden="true" />
                  {group.pdfReady ? "View answer key" : "Preview (coming soon)"}
                </Button>
              </div>
            </Stack>
          ) : null}
        </Stack>
      </Row>

      {group.pdfGrantId ? (
        <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{group.bookTitle} — Answer Key</DialogTitle>
            </DialogHeader>
            <p className="text-caption text-muted-foreground mb-2">
              This copy is watermarked with your email and order number.
              Sharing it is a violation of your purchase agreement.
            </p>
            {pdfOpen ? (
              <PdfCanvasViewer
                src={`/api/protected-pdf?grant=${group.pdfGrantId}`}
                title="answer key"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}
