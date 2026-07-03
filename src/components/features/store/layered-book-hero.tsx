"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/types";
import { BookCard } from "./book-card";
import { cn } from "@/lib/utils";

type Book = Omit<Tables<"books">, "audio_r2_key" | "pdf_r2_key" | "cost_paise">;

/**
 * LayeredBookHero — static 3D-layered arrangement.
 *
 * Positioning model:
 *   - Each book renders inside a full-bounds (`inset-0`) flex-centred
 *     overlay, so the inner motion.div translates from the CENTRE of
 *     the hero container, not from its top-left corner. This is the
 *     fix for "side books not visible on /ibdp + /igcse" — previously
 *     the absolute children defaulted to (0,0) and the negative x
 *     offset pushed them off-screen.
 *   - Z-order: side books behind, centre book on top.
 *
 * Children render inside the centre book's relative wrapper so mascot
 * scenes (Teacher / Student) anchor to the book.
 */

export interface LayeredBookHeroProps {
  center: Book;
  left?: Book[];
  right?: Book[];
  className?: string;
  children?: ReactNode;
}

export function LayeredBookHero({
  center,
  left = [],
  right = [],
  className,
  children,
}: LayeredBookHeroProps) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        "relative mx-auto",
        // Plenty of vertical room for the bigger centre book + the
        // mascot overlays above/below it.
        "min-h-[680px] sm:min-h-[760px] lg:min-h-[840px]",
        className,
      )}
      style={{ perspective: "1600px" }}
    >
      {/* Side books hidden below md — fixed-px offsets push them
          off-screen on phones. Centre book stands alone on mobile.
          Issue #82. */}
      <div className="hidden md:contents">
        {left.map((book, i) => (
          <CentredSideCard
            key={book.id}
            book={book}
            side="left"
            depth={i + 1}
            reduce={reduce ?? false}
          />
        ))}
        {right.map((book, i) => (
          <CentredSideCard
            key={book.id}
            book={book}
            side="right"
            depth={i + 1}
            reduce={reduce ?? false}
          />
        ))}
      </div>

      {/* Centre book — flex-centred inside the hero. Children
          (mascot scenes) live inside its relative wrapper. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          // Same idempotent pattern as side books: opacity-only animate
          // so re-renders never strand the book at opacity 0. Issue #51.
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          style={{
            zIndex: 20,
            filter: "drop-shadow(0 30px 50px rgb(0 0 0 / 0.4))",
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <BookCard book={center} size="xl" showMeta={false} asStatic priority />
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function CentredSideCard({
  book,
  side,
  depth,
  reduce,
}: {
  book: Book;
  side: "left" | "right";
  depth: number;
  reduce: boolean;
}) {
  const direction = side === "left" ? -1 : 1;
  // Side books are size=lg (288 px). Pulled in closer + less tilt so
  // they read as part of the same stage as the centre book, not far
  // back on the z-axis. (Issue #46.)
  const offsetX = direction * (200 + (depth - 1) * 100);
  const offsetY = -depth * 6;
  const rotateY = direction * -15;
  const scale = 0.94 - depth * 0.04;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 - depth }}
    >
      <motion.div
        // Position is set via `style` (no animation) so the books are
        // ALWAYS visible at their final spread, even after a same-route
        // re-click that re-renders the page without remounting framer.
        // Only opacity is tweened — a soft fade-in on first mount, and
        // a no-op on re-renders (opacity stays at 1). Issue #51.
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        style={{
          x: offsetX,
          y: offsetY,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
          filter: `drop-shadow(0 ${depth * 8}px ${depth * 14}px rgb(0 0 0 / 0.28)) brightness(${1 - depth * 0.08})`,
        }}
        transition={{
          duration: 0.55,
          ease: "easeOut",
          delay: 0.08 * depth,
        }}
      >
        <BookCard book={book} size="lg" showMeta={false} asStatic />
      </motion.div>
    </div>
  );
}
