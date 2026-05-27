"use client";

import { useState } from "react";
import Image from "next/image";
import { Headphones, Lock, BookOpenCheck, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Row, Stack } from "@/components/layouts/stack";
import { AddToCartButton } from "@/components/features/store/add-to-cart-button";
import { formatINR } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Book = Tables<"books">;

/**
 * CurriculumTabs — three tabs per FFR §A3 / §A4:
 *   Order Books  — every active book in the curriculum, with price + CTA.
 *   Answer Keys  — books with has_answer_key, gated state until ownership.
 *   Listening Audio — books with has_audio, same gating.
 *
 * For now the locked state is informational — actual streaming + PDF
 * viewer are Phase 4. Once the user is signed in + owns the book, the
 * lock flips to an "Open" CTA.
 */

interface CurriculumTabsProps {
  books: Book[];
}

type TabKey = "books" | "keys" | "audio";

const TABS: { key: TabKey; label: string; icon: typeof Headphones }[] = [
  { key: "books", label: "Order Books", icon: ShoppingBag },
  { key: "keys", label: "Answer Keys", icon: BookOpenCheck },
  { key: "audio", label: "Listening Audio", icon: Headphones },
];

export function CurriculumTabs({ books }: CurriculumTabsProps) {
  const [active, setActive] = useState<TabKey>("books");

  return (
    <Stack gap={6}>
      <Row gap={1} role="tablist" aria-label="Curriculum sections" className="border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-3 -mb-px",
              "border-b-2 transition-colors duration-150",
              "text-sm font-medium",
              active === tab.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </Row>

      {active === "books" ? <OrderBooksList books={books} /> : null}
      {active === "keys" ? <AccessList books={books.filter((b) => b.has_answer_key)} kind="answer_key" /> : null}
      {active === "audio" ? <AccessList books={books.filter((b) => b.has_audio)} kind="audio" /> : null}
    </Stack>
  );
}

function OrderBooksList({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No titles yet"
        description="This curriculum doesn't have any books listed right now. Check back soon — we add new editions every term."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <OrderBookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

function OrderBookCard({ book }: { book: Book }) {
  return (
    <Card variant="surface" padding="lg">
      <Stack gap={4}>
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={`/book-covers/${book.slug}.webp`}
            alt={book.title}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 320px, 100vw"
            className="object-cover"
          />
        </div>
        <Stack gap={2}>
          <p className="text-sm font-medium leading-tight line-clamp-3">{book.title}</p>
          {book.subtitle ? (
            <p className="text-caption">{book.subtitle}</p>
          ) : null}
          <span className="text-lg font-semibold">{formatINR(book.price_paise)}</span>
        </Stack>
        <AddToCartButton bookId={book.id} bookTitle={book.title} block />
      </Stack>
    </Card>
  );
}

function AccessList({ books, kind }: { books: Book[]; kind: "audio" | "answer_key" }) {
  if (books.length === 0) {
    const isAudio = kind === "audio";
    return (
      <EmptyState
        icon={isAudio ? Headphones : BookOpenCheck}
        title={isAudio ? "No audio companions" : "No answer keys"}
        description={
          isAudio
            ? "None of this curriculum's books ship with a listening companion yet."
            : "None of this curriculum's books have a downloadable answer key yet."
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {books.map((book) => (
        <LockedAccessCard key={book.id} book={book} kind={kind} />
      ))}
    </div>
  );
}

function LockedAccessCard({ book, kind }: { book: Book; kind: "audio" | "answer_key" }) {
  return (
    <Card variant="surface" padding="lg">
      <Stack gap={4}>
        <Row gap={3} align="start">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={`/book-covers/${book.slug}.webp`}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <Stack gap={1} className="flex-1">
            <CardTitle className="text-base">{book.title}</CardTitle>
            <CardDescription>
              {kind === "audio"
                ? "Listening companion audio — streamed through our app, never downloadable."
                : "Answer key PDF — watermarked with your email + order ID, view-only canvas."}
            </CardDescription>
          </Stack>
        </Row>
        <Row gap={2} align="center" justify="between">
          <Row gap={2} align="center">
            <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-caption">
              Unlocks when you own the physical book.
            </span>
          </Row>
          <Button size="sm" variant="outline" disabled>
            Locked
          </Button>
        </Row>
      </Stack>
    </Card>
  );
}
