"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Mascot } from "@/components/ui/mascot";

/**
 * BookwormReading — bookworm mascot + a small floating book that bobs
 * + rotates gently beside it. Decorative; drop anywhere in a Mode A
 * page that wants a reading-companion vibe.
 *
 * The book is an inline SVG (no asset dependency) styled to match the
 * brand. Motion respects prefers-reduced-motion (static when reduced).
 */

interface BookwormReadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BookwormReading({ className, size = "md" }: BookwormReadingProps) {
  const reduce = useReducedMotion();

  return (
    <div className={"relative inline-flex items-center gap-2 " + (className ?? "")}>
      <Mascot name="bookworm" size={size} hideCoupon />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none"
        animate={
          reduce
            ? undefined
            : {
                y: [0, -8, 0],
                rotate: [-3, 3, -3],
              }
        }
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <FloatingBookSVG />
      </motion.div>
    </div>
  );
}

function FloatingBookSVG() {
  // Small stylised book — cover gradient + spine line + a few page
  // lines. Uses brand vars so it tracks the active palette.
  return (
    <svg width="56" height="68" viewBox="0 0 56 68" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="floating-book-cover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-soft)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
      </defs>
      {/* Pages (white stack peeking out on the right) */}
      <rect x="10" y="8" width="40" height="56" rx="2" fill="oklch(0.97 0.005 175)" />
      <line x1="14" y1="14" x2="48" y2="14" stroke="oklch(0.85 0.005 175)" strokeWidth="0.6" />
      <line x1="14" y1="18" x2="48" y2="18" stroke="oklch(0.85 0.005 175)" strokeWidth="0.6" />
      <line x1="14" y1="22" x2="40" y2="22" stroke="oklch(0.85 0.005 175)" strokeWidth="0.6" />
      {/* Cover */}
      <rect x="4" y="6" width="44" height="58" rx="2" fill="url(#floating-book-cover)" />
      {/* Spine highlight */}
      <line x1="6" y1="8" x2="6" y2="62" stroke="white" strokeOpacity="0.35" strokeWidth="0.8" />
      {/* Title accent — a single bright line */}
      <line x1="14" y1="20" x2="32" y2="20" stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="14" y1="26" x2="38" y2="26" stroke="white" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
