"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import type { Tables } from "@/lib/supabase/types";
import { BookCard } from "./book-card";

type Book = Omit<Tables<"books">, "audio_r2_key" | "pdf_r2_key" | "cost_paise">;

/**
 * ScrollRevealHero — homepage staging:
 *   0–8%   : centre book solo.
 *   8–14%  : side books appear at CENTRE (opacity 0 → 1).
 *   14–55% : side books fan OUT from centre to final positions.
 *
 * Mascots on the homepage hero are intentionally REMOVED (per user
 * 2026-05-27). They stay on /ibdp + /igcse where the position fix is
 * verified. Below the hero the BookwormReading vignette still anchors
 * the brand.
 *
 * Positioning model (same as LayeredBookHero):
 *   - Each book lives inside a full-bounds flex-centred overlay so
 *     framer's x/y motion translates from CENTRE, not top-left.
 *   - Scroll-driven transforms run through useSpring for smoothness —
 *     raw useTransform output is jittery on direct mouse-wheel input.
 */

interface ScrollRevealHeroProps {
  center: Book;
  left: Book[];
  right: Book[];
}

const SCROLL_SPRING = { stiffness: 120, damping: 30, mass: 0.4 };

export function ScrollRevealHero({ center, left, right }: ScrollRevealHeroProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Smoothing layer — turns the raw scroll progress into a damped
  // signal so derived transforms don't jitter.
  const smoothed = useSpring(scrollYProgress, SCROLL_SPRING);

  const oneConst = useMotionValue(1);

  // Slower fan-out (15–70% of scroll) + extended sticky region (300vh)
  // so books linger fully expanded before the rest of the page comes
  // into view. User asked: 'let the books expand fully and only after
  // that scroll'.
  const sideOpacityRaw = useTransform(smoothed, [0.08, 0.16], [0, 1]);
  const sideSpreadRaw = useTransform(smoothed, [0.16, 0.70], [0, 1]);

  const sideOpacity = reduce ? oneConst : sideOpacityRaw;
  const sideSpread = reduce ? oneConst : sideSpreadRaw;

  return (
    // Mobile (<md): no fan-out scroll reveal — the fixed-px offsetX
    // values push side books off-screen, so we just show the centre
    // book in a normal-height container. md+ gets the 3-screen sticky
    // scroll experience. Issue #82.
    <div ref={ref} className="relative py-10 md:py-0 md:min-h-[300vh]">
      <div className="flex items-center justify-center overflow-visible md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
        <div
          className="relative mx-auto flex w-full items-center justify-center"
          style={{ perspective: "1600px" }}
        >
          {/* Side books hidden on mobile — see comment above. */}
          <div className="hidden md:contents">
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
          </div>

          {/* Centre book — flex-centred. Mascots intentionally removed. */}
          <motion.div
            className="relative"
            style={{
              zIndex: 20,
              filter: "drop-shadow(0 30px 50px rgb(0 0 0 / 0.45))",
            }}
          >
            <BookCard book={center} size="xl" showMeta={false} asStatic priority />
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
  // Side cards are size=lg (288 px). Tighter spread + less tilt brings
  // them closer to the centre book on the z-axis so the whole stage
  // reads as one tableau, not foreground + distant rear. (Issue #46.)
  const finalX = direction * (220 + (depth - 1) * 110);
  const finalY = -depth * 6;
  const finalRotateY = direction * -15;
  const finalScale = 0.94 - depth * 0.04;

  const x = useTransform(spread, (v) => finalX * v);
  const y = useTransform(spread, (v) => finalY * v);
  const rotateY = useTransform(spread, (v) => finalRotateY * v);
  const scale = useTransform(spread, (v) => 1 - (1 - finalScale) * v);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10 - depth }}
    >
      <motion.div
        style={{
          opacity,
          x,
          y,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
          filter: `drop-shadow(0 ${depth * 8}px ${depth * 14}px rgb(0 0 0 / 0.28)) brightness(${1 - depth * 0.08})`,
        }}
      >
        <BookCard book={book} size="lg" showMeta={false} asStatic />
      </motion.div>
    </div>
  );
}
