"use client";

import { useEffect, useRef, useState } from "react";
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
            {/* Legal notice lives in PdfCanvasViewer now (#119) — don't duplicate it. */}
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

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function AudioPlaylist({ tracks }: { tracks: { id: string; title: string }[] }) {
  const [active, setActive] = useState(tracks[0]?.id ?? null);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Only auto-start playback after the user explicitly picks a track.
  // On first render the player loads the first track paused, so opening
  // the library never blasts audio unprompted.
  const userPickedRef = useRef(false);

  // playbackRate resets when the <audio> loads a new src, so re-apply
  // the chosen speed whenever the track changes or the user picks a speed.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, active]);

  return (
    <Stack gap={3}>
      {active ? (
        <Stack gap={2}>
          <audio
            ref={audioRef}
            controls
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            onLoadedMetadata={(e) => {
              e.currentTarget.playbackRate = speed;
              // Resume playback only when the user switched tracks — never
              // on the initial mount.
              if (userPickedRef.current) void e.currentTarget.play();
            }}
            className="w-full"
            src={`/api/stream-audio?track=${active}`}
          >
            Your browser doesn&apos;t support audio playback.
          </audio>
          <Row gap={1} align="center" className="flex-wrap">
            <span className="text-caption text-muted-foreground mr-1">Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={
                  "rounded-md px-2 py-1 text-caption tabular-nums transition-colors " +
                  (speed === s
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent")
                }
              >
                {s}×
              </button>
            ))}
          </Row>
        </Stack>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border overflow-hidden">
        {tracks.map((t, i) => {
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  userPickedRef.current = true;
                  setActive(t.id);
                }}
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
