"use client";

/**
 * Mode A motion primitives. Storefront-only.
 * Admin / dashboard / checkout routes must NEVER import from this file —
 * Framer Motion is ~30kb gzipped and adds nothing to operational UI.
 *
 * Every primitive respects `prefers-reduced-motion` via useReducedMotion()
 * and degrades to a no-op wrapper.
 */

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import {
  cinematicReveal,
  fadeUp,
  hoverScale,
  spring,
  staggerContainer,
  staggerItem,
  tapScale,
} from "./tokens";

type DivMotionProps = HTMLMotionProps<"div">;

interface FadeInProps extends Omit<DivMotionProps, "initial" | "animate" | "variants" | "transition"> {
  delay?: number;
  as?: ElementType;
  children: ReactNode;
}

export function FadeIn({ delay = 0, children, ...rest }: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ ...cinematicReveal, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends Omit<DivMotionProps, "initial" | "animate" | "variants"> {
  children: ReactNode;
}

export function Stagger({ children, ...rest }: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} {...rest}>
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends Omit<DivMotionProps, "variants"> {
  children: ReactNode;
}

export function StaggerItem({ children, ...rest }: StaggerItemProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div variants={staggerItem} {...rest}>
      {children}
    </motion.div>
  );
}

interface HoverLiftProps extends Omit<DivMotionProps, "whileHover" | "whileTap" | "transition"> {
  children: ReactNode;
}

export function HoverLift({ children, ...rest }: HoverLiftProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div whileHover={hoverScale} whileTap={tapScale} transition={spring} {...rest}>
      {children}
    </motion.div>
  );
}
