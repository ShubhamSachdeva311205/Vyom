"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Row, Stack } from "@/components/layouts/stack";
import { AddToCartButton } from "@/components/features/store/add-to-cart-button";
import { ViewSampleButton } from "@/components/features/store/view-sample-button";
import { formatINR } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Book = Tables<"books"> & { hasSample?: boolean };

type FilterKey = "all" | "ibdp" | "igcse";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ibdp", label: "IBDP" },
  { key: "igcse", label: "IGCSE" },
];

interface StoreListingProps {
  books: Book[];
}

/**
 * StoreListing — unified /store grid per FFR §A5.
 * Curriculum filter chips → All / IBDP / IGCSE. Grid of cover cards
 * with cover + title + curriculum tag + price + discount-elig badge +
 * Order CTA (currently disabled — checkout lands in Phase 3).
 */
export function StoreListing({ books }: StoreListingProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(() => {
    if (filter === "all") return books;
    return books.filter((b) => b.curriculum === filter);
  }, [books, filter]);

  return (
    <Stack gap={6}>
      <Row gap={2} wrap role="tablist" aria-label="Curriculum filter">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-mono-tag transition-colors duration-150",
              "border",
              filter === f.key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </Row>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((book) => (
          <StoreBookCard key={book.id} book={book} />
        ))}
      </div>
    </Stack>
  );
}

function StoreBookCard({ book }: { book: Book }) {
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
          <Row gap={2} align="center" wrap>
            <Badge variant="outline" size="sm">
              {book.curriculum.toUpperCase()}
            </Badge>
            {book.has_audio ? <Badge variant="secondary" size="sm">Audio</Badge> : null}
            {book.has_answer_key ? <Badge variant="secondary" size="sm">Answer key</Badge> : null}
          </Row>
          <p className="text-sm font-medium leading-tight line-clamp-3">{book.title}</p>
          {book.subtitle ? (
            <p className="text-caption line-clamp-2">{book.subtitle}</p>
          ) : null}
          <span className="text-lg font-semibold">{formatINR(book.price_paise)}</span>
        </Stack>
        <Stack gap={2}>
          <AddToCartButton
            bookId={book.id}
            bookTitle={book.title}
            block
            outOfStock={book.inventory_count === 0}
          />
          {book.hasSample ? (
            <ViewSampleButton bookId={book.id} bookTitle={book.title} block />
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}
