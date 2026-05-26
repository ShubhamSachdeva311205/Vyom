"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/types";
import { BookCard } from "./book-card";
import { cn } from "@/lib/utils";

type Book = Tables<"books">;

/**
 * LayeredBookHero — static 3D-layered arrangement. Centre book on top
 * (size="xl"), side books fan out behind in different z-layers with
 * rotateY + translateZ + scale + drop-shadow.
 *
 * The `children` slot is rendered INSIDE the centre book wrapper, so
 * any absolutely-positioned mascot scenes inside it are positioned
 * relative to the centre book itself (not the outer container).
 *
 * Side book offsets push deeper books further out so all are visible
 * even with several depth levels (was only ~3 visible at /ibdp before).
 */

export interface LayeredBookHeroProps {
  center: Book;
  left?: Book[];
  right?: Book[];
  className?: string;
  /** Rendered inside the centre book wrapper (mascot scenes, etc). */
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
        "relative mx-auto flex items-center justify-center",
        "min-h-[560px] sm:min-h-[640px] lg:min-h-[720px]",
        className,
      )}
      style={{ perspective: "1400px" }}
    >
      {[...left].map((book, i) => {
        const depth = i + 1;
        return (
          <SideCard
            key={book.id}
            book={book}
            side="left"
            depth={depth}
            reduce={reduce ?? false}
          />
        );
      })}
      {[...right].map((book, i) => {
        const depth = i + 1;
        return (
          <SideCard
            key={book.id}
            book={book}
            side="right"
            depth={depth}
            reduce={reduce ?? false}
          />
        );
      })}

      {/* Centre book wrapper — relative so children can position
          themselves against the book. */}
      <motion.div
        className="relative"
        initial={reduce ? false : { opacity: 0, y: 20, scale: 0.92 }}
        animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        style={{
          zIndex: 20,
          filter: "drop-shadow(0 24px 40px rgb(0 0 0 / 0.35))",
        }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      >
        <BookCard book={center} size="xl" showMeta={false} asStatic priority />
        {children}
      </motion.div>
    </div>
  );
}

function SideCard({
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
  // Push deeper books much further out so all are visible.
  const offsetX = direction * (90 + (depth - 1) * 65);
  const offsetY = -depth * 8;
  const rotateY = direction * -22; // tilt facing centre
  const scale = 0.82 - depth * 0.05;
  const finalState = { x: offsetX, y: offsetY, rotateY, scale, opacity: 1 };

  return (
    <motion.div
      className="absolute"
      initial={reduce ? false : { opacity: 0, x: 0, y: 0, rotateY: 0, scale: 0.6 }}
      animate={reduce ? undefined : finalState}
      style={{
        x: reduce ? offsetX : undefined,
        y: reduce ? offsetY : undefined,
        rotateY: reduce ? rotateY : undefined,
        scale: reduce ? scale : undefined,
        zIndex: 10 - depth,
        transformStyle: "preserve-3d",
        filter: `drop-shadow(0 ${depth * 6}px ${depth * 12}px rgb(0 0 0 / 0.25)) brightness(${1 - depth * 0.08})`,
      }}
      transition={{ type: "spring", stiffness: 240, damping: 28, delay: 0.08 * depth }}
    >
      <BookCard book={book} size="lg" showMeta={false} asStatic />
    </motion.div>
  );
}
