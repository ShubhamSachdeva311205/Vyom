"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Headphones, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stack, Row } from "@/components/layouts/stack";
import type { LibraryBook } from "@/lib/access/queries";

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

export function LibraryBookCard({ book }: { book: LibraryBook }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const coverSrc = book.coverImageUrl ?? `/book-covers/${book.bookSlug}.webp`;

  return (
    <Card variant="surface" padding="lg">
      <Row gap={4} align="start" className="flex-wrap">
        <div className="size-20 rounded-md bg-muted overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} alt="" className="size-full object-cover" />
        </div>
        <Stack gap={4} className="flex-1 min-w-[240px]">
          <p className="text-base font-medium">{book.bookTitle}</p>

          {/* Audio playlist */}
          {book.hasAudio ? (
            <Stack gap={2}>
              <Row gap={2} align="center" className="text-caption text-muted-foreground">
                <Headphones className="size-4" aria-hidden="true" />
                Listening audio
                {book.audioTracks.length > 0 ? ` · ${book.audioTracks.length} tracks` : ""}
              </Row>
              {book.audioTracks.length === 0 ? (
                <p className="text-caption text-muted-foreground">
                  Audio is being prepared — it&apos;ll appear here once uploaded.
                </p>
              ) : (
                <AudioPlaylist tracks={book.audioTracks} />
              )}
            </Stack>
          ) : null}

          {/* Answer key */}
          {book.hasPdf ? (
            <Stack gap={2}>
              <Row gap={2} align="center" className="text-caption text-muted-foreground">
                <FileText className="size-4" aria-hidden="true" />
                Answer key
              </Row>
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
                  <FileText className="size-4" aria-hidden="true" />
                  {book.pdfReady ? "View answer key" : "Preview (coming soon)"}
                </Button>
              </div>
            </Stack>
          ) : null}
        </Stack>
      </Row>

      {book.hasPdf ? (
        <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{book.bookTitle} — Answer Key</DialogTitle>
            </DialogHeader>
            <p className="text-caption text-muted-foreground mb-2">
              This copy is watermarked with your email and order number.
              Sharing it is a violation of your purchase agreement.
            </p>
            {pdfOpen ? (
              <PdfCanvasViewer
                src={`/api/protected-pdf?grant=${book.grantId}`}
                title="answer key"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}

function AudioPlaylist({ tracks }: { tracks: { id: string; title: string }[] }) {
  const [active, setActive] = useState(tracks[0]?.id ?? null);

  return (
    <Stack gap={3}>
      {active ? (
        <audio
          controls
          controlsList="nodownload noplaybackrate"
          onContextMenu={(e) => e.preventDefault()}
          className="w-full"
          src={`/api/stream-audio?track=${active}`}
          autoPlay
        >
          Your browser doesn&apos;t support audio playback.
        </audio>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border overflow-hidden">
        {tracks.map((t, i) => {
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActive(t.id)}
                className={
                  "w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors " +
                  (isActive ? "bg-accent/60 font-medium" : "hover:bg-accent/30")
                }
              >
                <Music className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-caption text-muted-foreground tabular-nums w-6">
                  {i + 1}
                </span>
                <span className="truncate">{t.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Stack>
  );
}
