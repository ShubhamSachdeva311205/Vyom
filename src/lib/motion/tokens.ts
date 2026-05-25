/**
 * Mode A motion tokens — values lifted verbatim from
 * design/design-system-spec.md. Do NOT redefine inline; always import.
 * Mode B (admin / dashboard / checkout) must not consume these.
 */
import type { Transition, Variants } from "framer-motion";

export const spring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const cinematicReveal: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

export const hoverScale = { scale: 1.02 } as const;
export const tapScale = { scale: 0.98 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: cinematicReveal },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = fadeUp;
