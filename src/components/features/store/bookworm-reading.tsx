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
  // 70×52 viewbox. Pages use var(--muted) — mid-tone that stays
  // visible against both light and dark backgrounds. Covers use brand
  // gradients so the book reads as part of the palette.
  return (
    <svg width="64" height="48" viewBox="0 0 70 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bw-cover-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-soft)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
        <linearGradient id="bw-cover-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
      </defs>

      {/* Left page — slight fan from spine outward */}
      <path
        d="M 35 8 L 35 48 L 6 46 L 4 12 Z"
        fill="var(--muted)"
        stroke="var(--foreground)"
        strokeOpacity="0.35"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Left cover (peeks behind the page) */}
      <path d="M 4 12 L 6 46 L 2 46 L 0 12 Z" fill="url(#bw-cover-left)" />

      {/* Right page */}
      <path
        d="M 35 8 L 35 48 L 64 46 L 66 12 Z"
        fill="var(--muted)"
        stroke="var(--foreground)"
        strokeOpacity="0.35"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Right cover */}
      <path d="M 66 12 L 64 46 L 68 46 L 70 12 Z" fill="url(#bw-cover-right)" />

      {/* Spine */}
      <line
        x1="35"
        y1="8"
        x2="35"
        y2="48"
        stroke="var(--foreground)"
        strokeOpacity="0.5"
        strokeWidth="1"
      />

      {/* Text lines — dashes on each page for readability */}
      <g stroke="var(--foreground)" strokeOpacity="0.45" strokeWidth="0.8" strokeLinecap="round">
        <line x1="10" y1="18" x2="30" y2="17" />
        <line x1="10" y1="24" x2="30" y2="23" />
        <line x1="10" y1="30" x2="26" y2="29" />
        <line x1="10" y1="36" x2="30" y2="35" />

        <line x1="40" y1="17" x2="60" y2="18" />
        <line x1="40" y1="23" x2="60" y2="24" />
        <line x1="40" y1="29" x2="56" y2="30" />
        <line x1="40" y1="35" x2="60" y2="36" />
      </g>
    </svg>
  );
}
