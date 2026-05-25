"use client";

/**
 * KineticHeading — splits a heading into words and reveals them with a
 * staggered slide-up + fade. matvoyce.tv-flavored entrance.
 *
 * Storefront-only. Respects prefers-reduced-motion (renders flat string).
 * One word can be optionally emphasized with the brand color and a slight
 * weight bump.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Fragment, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface KineticHeadingProps {
  children: string;
  as?: ElementType;
  /** Zero-based index of the word to highlight in brand color. */
  emphasize?: number;
  className?: string;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const wordVariants = {
  hidden: { opacity: 0, y: "0.7em" },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function KineticHeading({
  children,
  as: Tag = "h1",
  emphasize,
  className,
}: KineticHeadingProps) {
  const reduce = useReducedMotion();
  const words = children.split(/\s+/);

  if (reduce) {
    return (
      <Tag className={cn("text-kinetic", className)}>
        {words.map((word, i) => (
          <Fragment key={i}>
            <span className={i === emphasize ? "text-brand" : undefined}>{word}</span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={cn("text-kinetic", className)}>
      <motion.span
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="inline-block"
      >
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden align-[-0.18em] pr-[0.25em]">
            <motion.span
              variants={wordVariants}
              className={cn("inline-block", i === emphasize && "text-brand")}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
