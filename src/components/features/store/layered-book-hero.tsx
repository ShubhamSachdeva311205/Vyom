"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/types";
import { BookCard } from "./book-card";
import { cn } from "@/lib/utils";

type Book = Tables<"books">;

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

      {/* Centre book — flex-centred inside the hero. Children
          (mascot scenes) live inside its relative wrapper. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          initial={reduce ? false : { opacity: 0, y: 20, scale: 0.92 }}
          animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          style={{
            zIndex: 20,
            filter: "drop-shadow(0 30px 50px rgb(0 0 0 / 0.4))",
          }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
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
  // Big spread. Side books are size=md (192 px); each depth needs
  // ~150 px of additional offset so it clearly peeks past the prior.
  const offsetX = direction * (260 + (depth - 1) * 160);
  const offsetY = -depth * 6;
  const rotateY = direction * -22;
  const scale = 0.92 - depth * 0.05;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 - depth }}
    >
      <motion.div
        // Inside this flex-centred wrapper, the motion div sits at the
        // centre by default. Framer's x/y/rotateY/scale build off that.
        initial={reduce ? false : { opacity: 0, x: 0, y: 0, rotateY: 0, scale: 0.6 }}
        animate={
          reduce
            ? undefined
            : { opacity: 1, x: offsetX, y: offsetY, rotateY, scale }
        }
        style={{
          x: reduce ? offsetX : undefined,
          y: reduce ? offsetY : undefined,
          rotateY: reduce ? rotateY : undefined,
          scale: reduce ? scale : undefined,
          transformStyle: "preserve-3d",
          filter: `drop-shadow(0 ${depth * 8}px ${depth * 14}px rgb(0 0 0 / 0.28)) brightness(${1 - depth * 0.08})`,
        }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 28,
          delay: 0.1 * depth,
        }}
      >
        <BookCard book={book} size="md" showMeta={false} asStatic />
      </motion.div>
    </div>
  );
}
