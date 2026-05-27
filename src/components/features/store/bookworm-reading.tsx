"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mascot } from "@/components/ui/mascot";

/**
 * BookwormReading — bookworm mascot reading a small open book held off
 * to one side of its body. The pages of the open book face the
 * bookworm (away from the viewer), so we see the BACKS of the two
 * open covers in a soft V with the spine running down the middle.
 * Page edges peek out along the open side at the bottom.
 *
 * The mascot's awake face is pinned on. Pupils are nudged right + down
 * so the eyes look toward the book, and wobble in lock-step with the
 * book's float so the gaze visibly tracks what it's reading.
 *
 * Respects useReducedMotion (book + pupils all static when reduced).
 */

interface BookwormReadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const FLOAT_DURATION = 5;
// Repeat-reverse on a single target gives a sinusoidal in-out that
// keeps the motion continuous instead of stepping through 3 keyframes.
// Bigger amplitude on the pupils too — sub-1px motion was rendering
// as flicker on the SVG sub-element (no GPU layer like a div wrapper
// gets). Issue #52.
const BOOK_FLOAT = { y: -6, rotate: 3 };
const PUPIL_FLOAT = { x: 3, y: -2 };
const FLOAT_TRANSITION = {
  duration: FLOAT_DURATION / 2,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};
const BOOK_INITIAL = { y: 0, rotate: -3 };

export function BookwormReading({ className, size = "md" }: BookwormReadingProps) {
  const reduce = useReducedMotion();

  return (
    <div className={"relative inline-flex items-center justify-center " + (className ?? "")}>
      <Mascot
        name="bookworm"
        size={size}
        hideCoupon
        awake
        lookOffsetX={3}
        lookOffsetY={6}
        pupilAnimate={PUPIL_FLOAT}
        pupilTransition={FLOAT_TRANSITION}
      />

      {/* Open book — nudged further right and lower, plus a 180°
          flip on the SVG so the V opens upward (covers fanning up,
          page edges along the top edge). */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: "18%",
          left: "76%",
          translateX: "-50%",
        }}
        initial={reduce ? false : BOOK_INITIAL}
        animate={reduce ? undefined : BOOK_FLOAT}
        transition={FLOAT_TRANSITION}
      >
        <OpenBookSVG />
      </motion.div>
    </div>
  );
}

function OpenBookSVG() {
  // ViewBox 90 × 60. We are looking at the BACK of an open book — the
  // bookworm holds it with the pages facing itself, so we see two
  // back-cover panels in a soft V meeting at a vertical spine. Cream
  // page edges peek out along the bottom (where the book is open).
  return (
    <svg
      width="96"
      height="64"
      viewBox="0 0 90 60"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)]"
    >
      <defs>
        <linearGradient id="bw-cover-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
        <linearGradient id="bw-cover-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
      </defs>

      {/* All paths wrapped in a 180° rotation about the viewbox centre
          (45, 30) so the V mouth points UP instead of down and page
          edges sit along the top edge. */}
      <g transform="rotate(180 45 30)">

      {/* Left back cover — narrower at the top (perspective), wider at
          the bottom where it opens. */}
      <path
        d="M 45 8
           L 14 12
           L 10 50
           L 45 47 Z"
        fill="url(#bw-cover-left)"
        stroke="oklch(0.20 0.04 280)"
        strokeOpacity="0.45"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Right back cover — mirror. */}
      <path
        d="M 45 8
           L 76 12
           L 80 50
           L 45 47 Z"
        fill="url(#bw-cover-right)"
        stroke="oklch(0.20 0.04 280)"
        strokeOpacity="0.45"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Centre spine — the binding running top to bottom. */}
      <line
        x1="45"
        y1="8"
        x2="45"
        y2="47"
        stroke="oklch(0.18 0.05 280)"
        strokeOpacity="0.75"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Page edges peeking out along the bottom (the open side). Thin
          cream slivers below each cover panel. */}
      <path
        d="M 10 50
           L 45 47
           L 45 51
           L 12 53 Z"
        fill="oklch(0.94 0.012 78)"
        stroke="oklch(0.78 0.01 78)"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <path
        d="M 80 50
           L 45 47
           L 45 51
           L 78 53 Z"
        fill="oklch(0.94 0.012 78)"
        stroke="oklch(0.78 0.01 78)"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />

      {/* Tiny title-bar suggestion on each back cover — a faint
          lighter stripe so the covers don't read as blank panels. */}
      <rect
        x="18"
        y="22"
        width="20"
        height="3"
        rx="0.8"
        fill="white"
        fillOpacity="0.16"
      />
      <rect
        x="52"
        y="22"
        width="20"
        height="3"
        rx="0.8"
        fill="white"
        fillOpacity="0.16"
      />
      </g>
    </svg>
  );
}
