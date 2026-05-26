"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Tables } from "@/lib/supabase/types";
import { BookCard } from "./book-card";
import { cn } from "@/lib/utils";

type Book = Tables<"books">;

/**
 * LayeredBookHero — center book on top, side books fanning out behind
 * in different z-layers with subtle rotateY + scale to suggest depth.
 *
 * Used directly on /ibdp and /igcse (no scroll-driven reveal). The
 * homepage wraps it in ScrollRevealHero which interpolates the same
 * positions based on scroll progress.
 *
 * Layout shape:
 *   - left: 1-3 books fanned out to the left, each one further left + rotated
 *           more
 *   - center: 1 book elevated + slightly larger, on top
 *   - right: mirror of left
 */

export interface LayeredBookHeroProps {
  center: Book;
  left?: Book[];
  right?: Book[];
  className?: string;
  /** Children rendered on top of the books (mascot scenes etc). */
  children?: React.ReactNode;
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
        "min-h-[520px] sm:min-h-[600px] lg:min-h-[680px]",
        className,
      )}
      style={{ perspective: "1400px" }}
    >
      {/* LEFT side books — fan outward + rotate inward */}
      {left.map((book, i) => {
        const total = left.length;
        const depth = i + 1; // 1, 2, 3 (back-to-front for the left fan)
        const offsetX = -depth * 64; // px translation outward
        const offsetY = -depth * 8; // slightly higher as we go back
        const rotateY = 22; // tilt facing center
        const scale = 0.78 - depth * 0.04;
        return (
          <motion.div
            key={book.id}
            className="absolute"
            initial={reduce ? false : { opacity: 0, x: 0, y: 0, rotateY: 0, scale: 0.6 }}
            animate={
              reduce
                ? undefined
                : {
                    opacity: 1,
                    x: offsetX,
                    y: offsetY,
                    rotateY,
                    scale,
                  }
            }
            style={{
              x: reduce ? offsetX : undefined,
              y: reduce ? offsetY : undefined,
              rotateY: reduce ? rotateY : undefined,
              scale: reduce ? scale : undefined,
              zIndex: 10 - depth,
              transformStyle: "preserve-3d",
              filter: `drop-shadow(0 ${depth * 6}px ${depth * 12}px rgb(0 0 0 / 0.25)) brightness(${1 - depth * 0.06})`,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 28,
              delay: 0.08 * (total - i),
            }}
          >
            <BookCard book={book} size="md" showMeta={false} />
          </motion.div>
        );
      })}

      {/* RIGHT side books — mirrored */}
      {right.map((book, i) => {
        const total = right.length;
        const depth = i + 1;
        const offsetX = depth * 64;
        const offsetY = -depth * 8;
        const rotateY = -22;
        const scale = 0.78 - depth * 0.04;
        return (
          <motion.div
            key={book.id}
            className="absolute"
            initial={reduce ? false : { opacity: 0, x: 0, y: 0, rotateY: 0, scale: 0.6 }}
            animate={
              reduce
                ? undefined
                : {
                    opacity: 1,
                    x: offsetX,
                    y: offsetY,
                    rotateY,
                    scale,
                  }
            }
            style={{
              x: reduce ? offsetX : undefined,
              y: reduce ? offsetY : undefined,
              rotateY: reduce ? rotateY : undefined,
              scale: reduce ? scale : undefined,
              zIndex: 10 - depth,
              transformStyle: "preserve-3d",
              filter: `drop-shadow(0 ${depth * 6}px ${depth * 12}px rgb(0 0 0 / 0.25)) brightness(${1 - depth * 0.06})`,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 28,
              delay: 0.08 * (total - i),
            }}
          >
            <BookCard book={book} size="md" showMeta={false} />
          </motion.div>
        );
      })}

      {/* CENTER book — elevated + on top */}
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
        <BookCard book={center} size="lg" showMeta priority />
      </motion.div>

      {children}
    </div>
  );
}
