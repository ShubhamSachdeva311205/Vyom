"use client";

/**
 * Mascot — Advaita's study companions, rendered as soft distorted gradient
 * blobs with a sleeping-smile face. Hover to wake them up; student and
 * teacher carry discount-code chips (student10 / teacher10 per CLAUDE.md
 * §7), the rest are decorative.
 *
 * Storefront-only. Do NOT import from operational routes — this component
 * pulls in framer-motion.
 *
 * To swap in proper illustrations later, only the BLOBS map changes.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CouponChip } from "./coupon-chip";

const wrapperVariants = cva("relative inline-flex flex-col items-center", {
  variants: {
    size: {
      xs: "gap-1",
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
      xs: "h-9 w-9",
      sm: "h-24 w-24",
      md: "h-40 w-40",
      lg: "h-56 w-56",
    },
  },
  defaultVariants: { size: "md" },
});

export type MascotName = "student" | "teacher" | "bookworm" | "star";

interface MascotProps extends VariantProps<typeof wrapperVariants> {
  name: MascotName;
  /** Override the coupon code that gets copied on click. */
  code?: string;
  /** Hide the coupon chip even if a default code exists. */
  hideCoupon?: boolean;
  /** Resting mood. Affects smile path and accessory color. */
  mood?: "happy" | "sad";
  label?: string;
  className?: string;
}

const DEFAULT_CODES: Partial<Record<MascotName, string>> = {
  student: "student10",
  teacher: "teacher10",
};

const FACE_STROKE = "oklch(0.14 0.04 175)";

/* ----------------------------------------------------------------
 * Accessory primitives — extra SVG layers that ride on top of the
 * face. They animate with the parent blob's spring (same SVG group).
 *
 * Accessories use currentColor for stroke + fill so the parent SVG's
 * `color` style (driven by the mood) controls accessory tint without
 * each accessory having to be aware of mood state.
 * ---------------------------------------------------------------- */

function CollarAccessory() {
  return (
    <g>
      <path
        d="M 78 162
           L 122 162
           L 122 178
           L 108 178
           L 100 168
           L 92 178
           L 78 178 Z"
        fill="oklch(0.99 0.005 175)"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </g>
  );
}

function GlassesAccessory() {
  return (
    <g>
      <rect
        x="56"
        y="80"
        width="36"
        height="26"
        rx="11"
        fill="oklch(0.99 0.01 75 / 0.18)"
      />
      <rect
        x="108"
        y="80"
        width="36"
        height="26"
        rx="11"
        fill="oklch(0.99 0.01 75 / 0.18)"
      />
      <g stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinejoin="round">
        <rect x="56" y="80" width="36" height="26" rx="11" />
        <rect x="108" y="80" width="36" height="26" rx="11" />
        <line x1="92" y1="93" x2="108" y2="93" />
      </g>
    </g>
  );
}

function CapAccessory() {
  return (
    <g>
      <path
        d="M 56 30 L 100 16 L 144 30 L 100 44 Z"
        fill="currentColor"
      />
      <rect x="74" y="44" width="52" height="4" rx="1" fill="currentColor" />
      <line
        x1="138"
        y1="28"
        x2="146"
        y2="48"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="146" cy="52" r="3" fill="var(--brand)" />
    </g>
  );
}

function HeadphonesAccessory() {
  // Thicker headband that arcs over the head, plus oval ear cups that
  // protrude into the body silhouette (not floating outside it).
  // Brand-color speaker dot on each cup, slightly larger so it reads.
  return (
    <g>
      <path
        d="M 32 90 Q 100 14 168 90"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="36" cy="98" rx="14" ry="20" fill="currentColor" />
      <ellipse cx="164" cy="98" rx="14" ry="20" fill="currentColor" />
      <ellipse
        cx="36"
        cy="98"
        rx="14"
        ry="20"
        fill="none"
        stroke="oklch(0.99 0.005 175 / 0.15)"
        strokeWidth="1.5"
      />
      <ellipse
        cx="164"
        cy="98"
        rx="14"
        ry="20"
        fill="none"
        stroke="oklch(0.99 0.005 175 / 0.15)"
        strokeWidth="1.5"
      />
      <circle cx="36" cy="98" r="4.5" fill="var(--brand)" />
      <circle cx="164" cy="98" r="4.5" fill="var(--brand)" />
    </g>
  );
}

function BackpackStrapAccessory() {
  return (
    <g>
      <path
        d="M 50 80 Q 70 130, 130 170"
        stroke="oklch(0.99 0.005 175)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 50 80 Q 70 130, 130 170"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

const ACCESSORIES: Record<string, ReactNode> = {
  collar: <CollarAccessory />,
  glasses: <GlassesAccessory />,
  cap: <CapAccessory />,
  headphones: <HeadphonesAccessory />,
  "backpack-strap": <BackpackStrapAccessory />,
};

/* ----------------------------------------------------------------
 * Blob shapes
 * ---------------------------------------------------------------- */

interface BlobConfig {
  path: string;
  gradient: [string, string, string];
  gradientOrigin: { cx: number; cy: number; r: number };
  tilt: number;
  face: {
    eyeY: number;
    eyeLeftX: number;
    eyeRightX: number;
    smileY: number;
    smileWidth: number;
  };
  accessory?: "collar" | "glasses" | "cap" | "headphones" | "backpack-strap";
  highlight: { cx: number; cy: number; rx: number; ry: number };
}

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
    face: { eyeY: 92, eyeLeftX: 72, eyeRightX: 128, smileY: 128, smileWidth: 42 },
    accessory: "collar",
    highlight: { cx: 64, cy: 56, rx: 46, ry: 32 },
  },

  teacher: {
    path:
      "M 100 8 " +
      "C 158 10, 188 46, 188 102 " +
      "C 188 158, 156 192, 100 192 " +
      "C 44 192, 12 158, 12 102 " +
      "C 12 46, 42 10, 100 8 Z",
    gradient: [
      "color-mix(in oklch, var(--mesh-accent-b) 60%, var(--brand) 40%)",
      "color-mix(in oklch, var(--brand) 70%, var(--mesh-accent-b) 30%)",
      "var(--brand-deep)",
    ],
    gradientOrigin: { cx: 38, cy: 24, r: 82 },
    tilt: 3,
    face: { eyeY: 96, eyeLeftX: 74, eyeRightX: 126, smileY: 132, smileWidth: 50 },
    accessory: "glasses",
    highlight: { cx: 74, cy: 50, rx: 46, ry: 34 },
  },

  bookworm: {
    path:
      "M 100 8 " +
      "C 140 8, 162 36, 162 78 " +
      "C 162 122, 158 162, 144 184 " +
      "C 136 198, 64 198, 56 184 " +
      "C 42 162, 38 122, 38 78 " +
      "C 38 36, 60 8, 100 8 Z",
    gradient: [
      "color-mix(in oklch, var(--mesh-accent-c) 55%, var(--brand) 45%)",
      "var(--brand)",
      "color-mix(in oklch, var(--brand-deep) 70%, var(--mesh-accent-c) 30%)",
    ],
    gradientOrigin: { cx: 36, cy: 22, r: 88 },
    tilt: 0,
    face: { eyeY: 116, eyeLeftX: 80, eyeRightX: 120, smileY: 148, smileWidth: 32 },
    accessory: "headphones",
    highlight: { cx: 66, cy: 44, rx: 36, ry: 30 },
  },

  star: {
    path:
      "M 36 60 " +
      "C 56 28, 116 24, 156 38 " +
      "C 192 52, 196 96, 178 124 " +
      "C 156 154, 102 162, 64 154 " +
      "C 28 148, 8 122, 12 88 " +
      "C 16 68, 24 62, 36 60 Z",
    gradient: [
      "color-mix(in oklch, var(--mesh-accent-b) 75%, white 25%)",
      "var(--mesh-accent-b)",
      "color-mix(in oklch, var(--brand-deep) 60%, var(--mesh-accent-b) 40%)",
    ],
    gradientOrigin: { cx: 30, cy: 32, r: 92 },
    tilt: 6,
    face: { eyeY: 84, eyeLeftX: 78, eyeRightX: 122, smileY: 116, smileWidth: 40 },
    highlight: { cx: 58, cy: 56, rx: 42, ry: 28 },
  },
};

/* ----------------------------------------------------------------
 * Framer Motion variants
 * ---------------------------------------------------------------- */

const blobMotion = {
  rest: { scale: 1 },
  hover: {
    scale: 1.04,
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
  mood = "happy",
  label,
  size,
  className,
}: MascotProps) {
  const reduce = useReducedMotion();
  const config = BLOBS[name];
  const couponCode = code ?? DEFAULT_CODES[name];
  const showCoupon = !hideCoupon && Boolean(couponCode);

  const gradientId = useId();
  const maskId = useId();
  const noiseId = useId();

  const [forceOpen, setForceOpen] = useState(false);
  const variantState = reduce ? "hover" : undefined;

  // Accessory color follows mood: red when sad, default face color when happy.
  // Exposed via CSS variable so each accessory's `currentColor` paths pick it up.
  const accessoryColor = mood === "sad" ? "var(--destructive)" : FACE_STROKE;
  const svgStyle: CSSProperties = {
    rotate: `${config.tilt}deg`,
    color: accessoryColor,
  };

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
        style={svgStyle}
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
              seed={
                name === "teacher"
                  ? 7
                  : name === "bookworm"
                    ? 11
                    : name === "star"
                      ? 13
                      : 3
              }
            />
            <feColorMatrix
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.22 0"
            />
          </filter>
        </defs>

        <g mask={`url(#${maskId})`}>
          <rect width="200" height="200" fill={`url(#${gradientId})`} />
          <rect width="200" height="200" filter={`url(#${noiseId})`} />
          <ellipse
            cx={config.highlight.cx}
            cy={config.highlight.cy}
            rx={config.highlight.rx}
            ry={config.highlight.ry}
            fill="white"
            opacity="0.18"
          />
        </g>

        {/* Resting face — closed eyes always; smile vs frown by mood. */}
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
          d={
            mood === "sad"
              ? `M ${100 - config.face.smileWidth / 2} ${config.face.smileY + 6} q ${config.face.smileWidth / 2} -10 ${config.face.smileWidth} 0`
              : `M ${100 - config.face.smileWidth / 2} ${config.face.smileY} q ${config.face.smileWidth / 2} 12 ${config.face.smileWidth} 0`
          }
          stroke={FACE_STROKE}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Awake face — open eyes + wider grin (hover state). When mood
            is sad we still let hover lift the mood slightly. */}
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

        {config.accessory ? ACCESSORIES[config.accessory] : null}
      </motion.svg>

      {showCoupon ? (
        <motion.div variants={chipMotion}>
          <CouponChip code={couponCode as string} />
        </motion.div>
      ) : null}
    </motion.div>
  );
}
