"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Row, Stack } from "@/components/layouts/stack";
import { AddToCartButton } from "@/components/features/store/add-to-cart-button";
import { ViewSampleButton } from "@/components/features/store/view-sample-button";
import { formatINR } from "@/lib/format";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Book = Omit<Tables<"books">, "audio_r2_key" | "pdf_r2_key" | "cost_paise"> & {
  hasSample?: boolean;
};

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
 * with GSAP staggered scroll entrance and restrained hover micro-interactions.
 */
export function StoreListing({ books }: StoreListingProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const gridRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    if (filter === "all") return books;
    return books.filter((b) => b.curriculum === filter);
  }, [books, filter]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = grid.querySelectorAll<HTMLElement>("[data-store-card]");
    if (reduce || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 88%",
            once: true,
          },
        },
      );
    }, grid);

    return () => ctx.revert();
  }, [filter, visible.length]);

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
              "rounded-full px-4 py-1.5 text-mono-tag transition-all duration-150 active:scale-[0.98]",
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

      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {visible.map((book) => (
          <StoreBookCard key={book.id} book={book} />
        ))}
      </div>
    </Stack>
  );
}

function StoreBookCard({ book }: { book: Book }) {
  const coverSrc =
    (book as { cover_image_url?: string | null }).cover_image_url ??
    `/book-covers/${book.slug}.webp`;
  return (
    <Card
      data-store-card
      variant="surface"
      padding="lg"
      className="group transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <Stack gap={4}>
        <Link
          href={`/store/${book.slug}`}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={coverSrc}
            alt={book.title}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 320px, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          />
        </Link>
        <Stack gap={2}>
          <Row gap={2} align="center" wrap>
            <Badge variant="outline" size="sm">
              {book.curriculum.toUpperCase()}
            </Badge>
            {book.has_audio ? <Badge variant="secondary" size="sm">Audio</Badge> : null}
            {book.has_answer_key ? <Badge variant="secondary" size="sm">Answer key</Badge> : null}
          </Row>
          <Link
            href={`/store/${book.slug}`}
            className="text-sm font-medium leading-tight line-clamp-3 hover:underline"
          >
            {book.title}
          </Link>
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
