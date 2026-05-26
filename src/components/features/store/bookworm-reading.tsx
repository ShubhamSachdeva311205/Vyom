"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mascot } from "@/components/ui/mascot";

/**
 * BookwormReading — bookworm mascot reading a small open book held off
 * to one side of its body. The mascot's awake face is pinned on and the
 * pupils wobble in lock-step with the book's float so the eyes visibly
 * track what it's reading.
 *
 * The OpenBookSVG is a classic front-on open-book illustration: two
 * cream pages spread in a soft V, dark spine in the middle, brand
 * cover-stripes peeking on the outer edges, faint text lines on each
 * page. Recognisable as a book at a glance.
 *
 * Respects useReducedMotion (book + pupils all static when reduced).
 */

interface BookwormReadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const FLOAT_DURATION = 4.5;
const BOOK_FLOAT = {
  y: [0, -5, 0],
  rotate: [-3, 3, -3],
};
// Same period, much smaller amplitude — eyes "follow" the book.
const PUPIL_FLOAT = {
  x: [-1, 1.5, -1],
  y: [0, -0.8, 0],
};
const FLOAT_TRANSITION = {
  duration: FLOAT_DURATION,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export function BookwormReading({ className, size = "md" }: BookwormReadingProps) {
  const reduce = useReducedMotion();

  return (
    <div className={"relative inline-flex items-center justify-center " + (className ?? "")}>
      <Mascot
        name="bookworm"
        size={size}
        hideCoupon
        awake
        lookOffsetX={6}
        pupilAnimate={PUPIL_FLOAT}
        pupilTransition={FLOAT_TRANSITION}
      />

      {/* Open book — held slightly to the right of the bookworm and
          raised closer to the face so it reads as something being
          read, not something floating away. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: "34%",
          left: "68%",
          translateX: "-50%",
        }}
        animate={reduce ? undefined : BOOK_FLOAT}
        transition={FLOAT_TRANSITION}
      >
        <OpenBookSVG />
      </motion.div>
    </div>
  );
}

function OpenBookSVG() {
  // ViewBox 90 × 60. Two cream pages meet at a central spine, gentle V
  // shape. Brand cover-stripes peek at the outer edges (so it reads as
  // an actual book with covers, not just sheets of paper). Faint text
  // lines and a centre crease shadow sell the depth.
  return (
    <svg
      width="96"
      height="64"
      viewBox="0 0 90 60"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]"
    >
      <defs>
        <linearGradient id="bw-page-left" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.92 0.012 78)" />
          <stop offset="60%" stopColor="oklch(0.97 0.008 78)" />
          <stop offset="100%" stopColor="oklch(0.95 0.012 78)" />
        </linearGradient>
        <linearGradient id="bw-page-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.92 0.012 78)" />
          <stop offset="60%" stopColor="oklch(0.97 0.008 78)" />
          <stop offset="100%" stopColor="oklch(0.95 0.012 78)" />
        </linearGradient>
      </defs>

      {/* Outer cover stripes — narrow brand-coloured rectangles flanking
          the pages, suggesting the book's bound covers. */}
      <rect
        x="4"
        y="13"
        width="4"
        height="38"
        rx="1.2"
        fill="var(--brand-deep)"
      />
      <rect
        x="82"
        y="13"
        width="4"
        height="38"
        rx="1.2"
        fill="var(--brand-deep)"
      />

      {/* Left page */}
      <path
        d="M 45 10
           C 32 9 18 10 9 14
           L 8 50
           C 22 47 35 46 45 47 Z"
        fill="url(#bw-page-left)"
        stroke="oklch(0.78 0.01 78)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Right page */}
      <path
        d="M 45 10
           C 58 9 72 10 81 14
           L 82 50
           C 68 47 55 46 45 47 Z"
        fill="url(#bw-page-right)"
        stroke="oklch(0.78 0.01 78)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      {/* Centre spine — slim dark line + soft shadow for crease depth. */}
      <line
        x1="45"
        y1="10"
        x2="45"
        y2="47"
        stroke="oklch(0.30 0.02 280)"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Text lines — three per page, decreasing in length toward bottom. */}
      <g
        stroke="oklch(0.35 0.02 280)"
        strokeOpacity="0.42"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <line x1="14" y1="22" x2="40" y2="21" />
        <line x1="14" y1="28" x2="37" y2="27" />
        <line x1="14" y1="34" x2="38" y2="33" />
        <line x1="14" y1="40" x2="33" y2="39" />

        <line x1="50" y1="21" x2="76" y2="22" />
        <line x1="53" y1="27" x2="76" y2="28" />
        <line x1="52" y1="33" x2="76" y2="34" />
        <line x1="57" y1="39" x2="76" y2="40" />
      </g>
    </svg>
  );
}
