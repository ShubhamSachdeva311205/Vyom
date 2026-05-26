"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mascot } from "@/components/ui/mascot";

/**
 * BookwormReading — bookworm mascot with a small floating OPEN book
 * resting in front of him (overlay, not beside). Book gently bobs +
 * tilts left/right like he's reading and flipping pages.
 *
 * Page colour uses var(--muted) so it stays visible against both light
 * and dark page backgrounds; previously near-white pages were invisible
 * in light mode.
 *
 * Respects useReducedMotion (static when reduced).
 */

interface BookwormReadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BookwormReading({ className, size = "md" }: BookwormReadingProps) {
  const reduce = useReducedMotion();

  return (
    <div className={"relative inline-flex items-center justify-center " + (className ?? "")}>
      <Mascot name="bookworm" size={size} hideCoupon />

      {/* Open book overlaid on the bookworm — anchored to the lower
          body so it reads as 'reading'. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: "12%",
          left: "50%",
          translateX: "-50%",
        }}
        animate={
          reduce
            ? undefined
            : {
                y: [0, -4, 0],
                rotate: [-3, 3, -3],
              }
        }
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <OpenBookSVG />
      </motion.div>
    </div>
  );
}

function OpenBookSVG() {
  // 70x52 viewbox. Renders the BACK of an open book held by the
  // bookworm — pages face the bookworm (away from camera), we see
  // the back covers + a thin sliver of page edges along the bottom.
  // Two cover panels in a soft V, joined at the spine line.
  return (
    <svg width="64" height="44" viewBox="0 0 70 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bw-back-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
        <linearGradient id="bw-back-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-soft)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
      </defs>

      {/* Left back cover */}
      <path
        d="M 35 6 L 35 46 L 6 44 L 4 10 Z"
        fill="url(#bw-back-left)"
        stroke="var(--foreground)"
        strokeOpacity="0.3"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Right back cover */}
      <path
        d="M 35 6 L 35 46 L 64 44 L 66 10 Z"
        fill="url(#bw-back-right)"
        stroke="var(--foreground)"
        strokeOpacity="0.3"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Spine line */}
      <line
        x1="35"
        y1="6"
        x2="35"
        y2="46"
        stroke="var(--foreground)"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />

      {/* Page edges peeking out along the bottom — thin slivers in
          muted colour so they read as paper, not background. */}
      <path
        d="M 35 46 L 6 44 L 8 47 L 35 49 Z"
        fill="var(--muted)"
        stroke="var(--foreground)"
        strokeOpacity="0.25"
        strokeWidth="0.5"
      />
      <path
        d="M 35 46 L 64 44 L 62 47 L 35 49 Z"
        fill="var(--muted)"
        stroke="var(--foreground)"
        strokeOpacity="0.25"
        strokeWidth="0.5"
      />

      {/* Subtle title/author lines on each back cover */}
      <g stroke="white" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round">
        <line x1="12" y1="20" x2="28" y2="19" />
        <line x1="14" y1="26" x2="26" y2="25" />
        <line x1="42" y1="19" x2="58" y2="20" />
        <line x1="44" y1="25" x2="56" y2="26" />
      </g>
    </svg>
  );
}
