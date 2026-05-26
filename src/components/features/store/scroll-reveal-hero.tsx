"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import type { Tables } from "@/lib/supabase/types";
import { BookCard } from "./book-card";
import { StudentHangingFromBook, TeacherSittingOnBook } from "./mascot-scenes";

type Book = Tables<"books">;

/**
 * ScrollRevealHero — homepage staging:
 *
 *   0–10%  : centre book solo.
 *   10–15% : side books appear at CENTRE (opacity 0 → 1, position still 0).
 *   15–50% : side books fan OUT from centre to their final positions.
 *   55–85% : mascots arrive (teacher sits on top, student hangs below).
 *
 * Splitting opacity from spread fixes the "they're just fading in"
 * complaint — now you see the books materialise at centre then move
 * outward.
 *
 * Reduced-motion users get the final state via constant MotionValues.
 */

interface ScrollRevealHeroProps {
  center: Book;
  left: Book[];
  right: Book[];
}

export function ScrollRevealHero({ center, left, right }: ScrollRevealHeroProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const oneConst = useMotionValue(1);
  const zeroConst = useMotionValue(0);

  // Opacity comes in first (10-15%), then the spread happens (15-50%).
  const sideOpacityAnim = useTransform(scrollYProgress, [0.10, 0.15], [0, 1]);
  const sideSpreadAnim = useTransform(scrollYProgress, [0.15, 0.50], [0, 1]);

  // Mascots arrive last.
  const mascotOpacityAnim = useTransform(scrollYProgress, [0.55, 0.85], [0, 1]);
  const mascotScaleAnim = useTransform(scrollYProgress, [0.55, 0.85], [0.6, 1]);

  const sideOpacity = reduce ? oneConst : sideOpacityAnim;
  const sideSpread = reduce ? oneConst : sideSpreadAnim;
  const mascotOpacity = reduce ? oneConst : mascotOpacityAnim;
  const mascotScale = reduce ? oneConst : mascotScaleAnim;

  return (
    <div ref={ref} className="relative min-h-[220vh]">
      {/* Sticky stage — books stay in view while page scrolls. */}
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center justify-center overflow-visible">
        <div
          className="relative mx-auto flex w-full items-center justify-center"
          style={{ perspective: "1400px" }}
        >
          {/* Side books — render before centre so they sit behind in DOM order. */}
          {left.map((book, i) => (
            <SideBook
              key={book.id}
              book={book}
              side="left"
              depth={i + 1}
              opacity={sideOpacity}
              spread={sideSpread}
            />
          ))}
          {right.map((book, i) => (
            <SideBook
              key={book.id}
              book={book}
              side="right"
              depth={i + 1}
              opacity={sideOpacity}
              spread={sideSpread}
            />
          ))}

          {/* Centre book + mascots inside its relative wrapper. The
              mascots become visible (mascotOpacity) at the end of the
              scroll; their position is anchored to this wrapper. */}
          <motion.div
            className="relative"
            style={{
              zIndex: 20,
              filter: "drop-shadow(0 24px 40px rgb(0 0 0 / 0.4))",
            }}
          >
            <BookCard book={center} size="xl" showMeta={false} asStatic priority />

            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: mascotOpacity,
                scale: mascotScale,
              }}
            >
              <TeacherSittingOnBook />
              <StudentHangingFromBook />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SideBook({
  book,
  side,
  depth,
  opacity,
  spread,
}: {
  book: Book;
  side: "left" | "right";
  depth: number;
  opacity: MotionValue<number>;
  spread: MotionValue<number>;
}) {
  const direction = side === "left" ? -1 : 1;
  // Wider spread so all 3 layers are visible (was depth*80 → now grows).
  const finalX = direction * (110 + (depth - 1) * 70);
  const finalY = -depth * 10;
  const finalRotateY = direction * -22;
  const finalScale = 0.82 - depth * 0.05;

  const x = useTransform(spread, (v) => finalX * v);
  const y = useTransform(spread, (v) => finalY * v);
  const rotateY = useTransform(spread, (v) => finalRotateY * v);
  // Scale stays close to 1 until they fan out (so they don't look tiny at centre).
  const scale = useTransform(spread, (v) => 1 - (1 - finalScale) * v);

  return (
    <motion.div
      className="absolute"
      style={{
        opacity,
        x,
        y,
        rotateY,
        scale,
        zIndex: 10 - depth,
        transformStyle: "preserve-3d",
        filter: `drop-shadow(0 ${depth * 6}px ${depth * 12}px rgb(0 0 0 / 0.25)) brightness(${1 - depth * 0.08})`,
      }}
    >
      <BookCard book={book} size="lg" showMeta={false} asStatic />
    </motion.div>
  );
}
