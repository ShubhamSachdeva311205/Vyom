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
 *   0–30%   : centre book solo.
 *   30–70%  : side books fan out behind it (3 left, 3 right).
 *   70–100% : mascots arrive.
 *
 * Reduced-motion users see the final state immediately via constant
 * MotionValues at value 1.
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

  // Constant MotionValues for the reduced-motion path (skip all
  // interpolation, jump straight to the final state).
  const oneConst = useMotionValue(1);
  const zeroConst = useMotionValue(0);

  // Stage 2 — side books spread (0 → 1 between 5% and 45% scroll).
  const sideOpacityAnim = useTransform(scrollYProgress, [0.05, 0.45], [0, 1]);
  const sideSpreadAnim = useTransform(scrollYProgress, [0.05, 0.45], [0, 1]);

  // Stage 3 — mascots fade in + slide up (55% → 85%).
  const mascotOpacityAnim = useTransform(scrollYProgress, [0.55, 0.85], [0, 1]);
  const mascotYAnim = useTransform(scrollYProgress, [0.55, 0.85], [40, 0]);

  const sideOpacity = reduce ? oneConst : sideOpacityAnim;
  const sideSpread = reduce ? oneConst : sideSpreadAnim;
  const mascotOpacity = reduce ? oneConst : mascotOpacityAnim;
  const mascotY = reduce ? zeroConst : mascotYAnim;

  return (
    <div ref={ref} className="relative min-h-[200vh]">
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center justify-center">
        <div
          className="relative mx-auto flex w-full max-w-4xl items-center justify-center"
          style={{ perspective: "1400px" }}
        >
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

          <motion.div
            className="relative"
            style={{
              zIndex: 20,
              filter: "drop-shadow(0 24px 40px rgb(0 0 0 / 0.4))",
            }}
          >
            <BookCard book={center} size="lg" showMeta priority />
          </motion.div>

          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: mascotOpacity,
              y: mascotY,
            }}
          >
            <div className="relative h-full w-full">
              <TeacherSittingOnBook />
              <StudentHangingFromBook />
            </div>
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
  const finalX = direction * depth * 80;
  const finalY = -depth * 10;
  const finalRotateY = direction * -22;
  const finalScale = 0.78 - depth * 0.04;

  const x = useTransform(spread, (v) => finalX * v);
  const y = useTransform(spread, (v) => finalY * v);
  const rotateY = useTransform(spread, (v) => finalRotateY * v);
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
        filter: `drop-shadow(0 ${depth * 6}px ${depth * 12}px rgb(0 0 0 / 0.25))`,
      }}
    >
      <BookCard book={book} size="md" showMeta={false} />
    </motion.div>
  );
}
