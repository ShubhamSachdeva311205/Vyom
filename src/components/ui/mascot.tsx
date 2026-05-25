"use client";

/**
 * Mascot — Advaita's study companions, rendered as soft distorted gradient
 * blobs with a sleeping-smile face. Hover to wake them up; each one carries
 * a discount-code Easter egg (student → student10, teacher → teacher10).
 *
 * Storefront-only. Do NOT import from operational routes — this component
 * pulls in framer-motion. The Mode A motion budget already accommodates it.
 *
 * To swap in proper illustrations later, only the BLOBS map changes.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { CouponChip } from "./coupon-chip";

const wrapperVariants = cva("relative inline-flex flex-col items-center", {
  variants: {
    size: {
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
    },
  },
  defaultVariants: { size: "md" },
});

const svgSizeVariants = cva("block", {
  variants: {
    size: {
      sm: "h-24 w-24",
      md: "h-40 w-40",
      lg: "h-56 w-56",
    },
  },
  defaultVariants: { size: "md" },
});

export type MascotName = "student" | "teacher";

interface MascotProps extends VariantProps<typeof wrapperVariants> {
  name: MascotName;
  /** Override the coupon code that gets copied on click. Defaults to the
   * code from CLAUDE.md §7 — student → student10, teacher → teacher10. */
  code?: string;
  /** Hide the coupon chip entirely (just a decorative blob). */
  hideCoupon?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_CODES: Record<MascotName, string> = {
  student: "student10",
  teacher: "teacher10",
};

interface BlobConfig {
  /** Distorted blob outline. ViewBox is 0 0 200 200. */
  path: string;
  /** Three-stop radial gradient — bright corner, mid, deep edge. */
  gradient: [string, string, string];
  /** Gradient origin in % within the viewBox. */
  gradientOrigin: { cx: number; cy: number; r: number };
  /** Resting tilt in degrees. */
  tilt: number;
  /** Face geometry — positions in viewBox coords. */
  face: {
    eyeY: number;
    eyeLeftX: number;
    eyeRightX: number;
    smileY: number;
    smileWidth: number;
  };
}

/**
 * Two distinct blob characters. Paths are hand-tuned organic curves —
 * not circles, not symmetric. Gradients use brand tokens so the active
 * palette flows through automatically.
 */
const BLOBS: Record<MascotName, BlobConfig> = {
  student: {
    path:
      "M 102 14 " +
      "C 150 10, 188 44, 186 100 " +
      "C 184 152, 142 188, 92 184 " +
      "C 40 180, 12 144, 14 90 " +
      "C 16 42, 50 18, 102 14 Z",
    gradient: [
      "color-mix(in oklch, var(--brand) 80%, white 20%)",
      "var(--brand)",
      "var(--brand-deep)",
    ],
    gradientOrigin: { cx: 32, cy: 28, r: 78 },
    tilt: -4,
    face: {
      eyeY: 92,
      eyeLeftX: 72,
      eyeRightX: 128,
      smileY: 128,
      smileWidth: 44,
    },
  },
  teacher: {
    path:
      "M 100 12 " +
      "C 156 14, 188 52, 188 104 " +
      "C 188 152, 158 188, 104 188 " +
      "C 48 188, 12 154, 12 100 " +
      "C 12 48, 46 14, 100 12 Z",
    gradient: [
      "color-mix(in oklch, var(--mesh-accent-b) 60%, var(--brand) 40%)",
      "color-mix(in oklch, var(--brand) 70%, var(--mesh-accent-b) 30%)",
      "var(--brand-deep)",
    ],
    gradientOrigin: { cx: 38, cy: 26, r: 82 },
    tilt: 3,
    face: {
      eyeY: 96,
      eyeLeftX: 74,
      eyeRightX: 126,
      smileY: 130,
      smileWidth: 52,
    },
  },
};

/* ----------------------------------------------------------------
 * Framer Motion variants — gentle bounce + face wake-up
 * ---------------------------------------------------------------- */
const FACE_STROKE = "oklch(0.14 0.04 175)";

const blobMotion = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.04,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 14 },
  },
};

const closedMotion = {
  rest: { opacity: 1 },
  hover: { opacity: 0, transition: { duration: 0.12 } },
};

const openMotion = {
  rest: { opacity: 0, scale: 0.85 },
  hover: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 360, damping: 18, delay: 0.05 },
  },
};

const restSmileMotion = {
  rest: { opacity: 1 },
  hover: { opacity: 0, transition: { duration: 0.12 } },
};

const grinMotion = {
  rest: { opacity: 0, scaleY: 0.6 },
  hover: {
    opacity: 1,
    scaleY: 1,
    transition: { type: "spring" as const, stiffness: 340, damping: 16, delay: 0.05 },
  },
};

const chipMotion = {
  rest: { opacity: 0, y: 6, scale: 0.95 },
  hover: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 360, damping: 22, delay: 0.06 },
  },
};

export function Mascot({
  name,
  code,
  hideCoupon = false,
  label,
  size,
  className,
}: MascotProps) {
  const reduce = useReducedMotion();
  const config = BLOBS[name];
  const couponCode = code ?? DEFAULT_CODES[name];
  const gradientId = useId();
  const maskId = useId();
  const noiseId = useId();

  // Keep the chip visible for keyboard-focus users too.
  const [forceOpen, setForceOpen] = useState(false);
  const variantState = reduce ? "hover" : undefined;

  return (
    <motion.div
      initial="rest"
      animate={forceOpen ? "hover" : variantState}
      whileHover={reduce ? undefined : "hover"}
      whileTap={reduce ? undefined : "hover"}
      onFocus={() => setForceOpen(true)}
      onBlur={() => setForceOpen(false)}
      className={cn(wrapperVariants({ size }), className)}
    >
      <motion.svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={!label}
        variants={blobMotion}
        style={{ rotate: config.tilt }}
        className={cn(svgSizeVariants({ size }), "overflow-visible")}
      >
        <defs>
          <radialGradient
            id={gradientId}
            cx={`${config.gradientOrigin.cx}%`}
            cy={`${config.gradientOrigin.cy}%`}
            r={`${config.gradientOrigin.r}%`}
          >
            <stop offset="0%" stopColor={config.gradient[0]} />
            <stop offset="55%" stopColor={config.gradient[1]} />
            <stop offset="100%" stopColor={config.gradient[2]} />
          </radialGradient>

          <mask id={maskId}>
            <path d={config.path} fill="white" />
          </mask>

          <filter id={noiseId} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed={name === "teacher" ? 7 : 3}
            />
            <feColorMatrix
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.22 0"
            />
          </filter>
        </defs>

        {/* Blob body — gradient + internal grain, both masked to the
            blob silhouette so they don't bleed past the edge. */}
        <g mask={`url(#${maskId})`}>
          <rect width="200" height="200" fill={`url(#${gradientId})`} />
          <rect width="200" height="200" filter={`url(#${noiseId})`} />
          {/* Soft inner highlight for that Mindspace "lit from inside" feel */}
          <ellipse
            cx={(config.gradientOrigin.cx / 100) * 200}
            cy={(config.gradientOrigin.cy / 100) * 200}
            rx="46"
            ry="34"
            fill="white"
            opacity="0.18"
          />
        </g>

        {/* Resting face — closed eyes + soft smile */}
        <motion.g variants={closedMotion} stroke={FACE_STROKE} strokeLinecap="round" fill="none">
          <path
            d={`M ${config.face.eyeLeftX - 8} ${config.face.eyeY} q 8 -8 16 0`}
            strokeWidth="5"
          />
          <path
            d={`M ${config.face.eyeRightX - 8} ${config.face.eyeY} q 8 -8 16 0`}
            strokeWidth="5"
          />
        </motion.g>
        <motion.path
          variants={restSmileMotion}
          d={`M ${100 - config.face.smileWidth / 2} ${config.face.smileY} q ${config.face.smileWidth / 2} 12 ${config.face.smileWidth} 0`}
          stroke={FACE_STROKE}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Awake face — open eyes + wider grin (hover state) */}
        <motion.g variants={openMotion} fill={FACE_STROKE}>
          <circle cx={config.face.eyeLeftX} cy={config.face.eyeY - 2} r="4" />
          <circle cx={config.face.eyeRightX} cy={config.face.eyeY - 2} r="4" />
        </motion.g>
        <motion.path
          variants={grinMotion}
          style={{ originX: "100px", originY: `${config.face.smileY}px` }}
          d={`M ${100 - (config.face.smileWidth + 14) / 2} ${config.face.smileY - 2} q ${(config.face.smileWidth + 14) / 2} 22 ${config.face.smileWidth + 14} 0`}
          stroke={FACE_STROKE}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>

      {!hideCoupon ? (
        <motion.div variants={chipMotion}>
          <CouponChip code={couponCode} />
        </motion.div>
      ) : null}
    </motion.div>
  );
}

