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
 * Color separation:
 *   - Accessory HARDWARE (band, frame, cups, cap) always uses FACE_STROKE.
 *   - Accessory ACCENTS (speaker dots, cap tassel) use currentColor, which
 *     the SVG sets to the active "accent" color (brand normally,
 *     destructive when mood="sad"). That's why a sad bookworm has the
 *     same black headphones, just with red LEDs.
 *
 * Mood:
 *   - "happy" (default): closed eyes + soft smile; hover wakes the face.
 *   - "sad": closed eyes + soft frown; hover does NOT change the face
 *     (the awake-face elements aren't rendered at all in sad mood).
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
  /** Resting mood. Affects smile path and accent (speaker-dot) color. */
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
 * Accessory primitives. Hardware uses FACE_STROKE directly; accents
 * use currentColor so the SVG-level mood swap re-tints just the
 * lights/tassels and leaves the hardware black.
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
        stroke={FACE_STROKE}
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
      <g stroke={FACE_STROKE} strokeWidth="3.5" fill="none" strokeLinejoin="round">
        <rect x="56" y="80" width="36" height="26" rx="11" />
        <rect x="108" y="80" width="36" height="26" rx="11" />
        <line x1="92" y1="93" x2="108" y2="93" />
      </g>
    </g>
  );
}

function CapAccessory() {
  // Cap hardware is FACE_STROKE (always black); tassel uses currentColor
  // so a "sad scholar" variant would naturally render a red tassel.
  return (
    <g>
      <path d="M 56 30 L 100 16 L 144 30 L 100 44 Z" fill={FACE_STROKE} />
      <rect x="74" y="44" width="52" height="4" rx="1" fill={FACE_STROKE} />
      <line
        x1="138"
        y1="28"
        x2="146"
        y2="48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="146" cy="52" r="3" fill="currentColor" />
    </g>
  );
}

function HeadphonesAccessory() {
  // Over-ear headphones inspired by the Kling reference: black circular
  // cups sitting mostly OUTSIDE the body silhouette (only a sliver
  // overlaps), connected by a thin band that arcs above the head. Only
  // the speaker LED at each cup centre picks up the accent color.
  return (
    <g>
      {/* Band — thin curve from left-cup top to right-cup top. */}
      <path
        d="M 28 88 Q 100 26 172 88"
        stroke={FACE_STROKE}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Ear cups — circles. Centres at (28, 100) and (172, 100). */}
      <circle cx="28" cy="100" r="15" fill={FACE_STROKE} />
      <circle cx="172" cy="100" r="15" fill={FACE_STROKE} />
      {/* Subtle inner ring for depth. */}
      <circle
        cx="28"
        cy="100"
        r="11"
        fill="none"
        stroke="oklch(0.99 0.005 175 / 0.12)"
        strokeWidth="1.5"
      />
      <circle
        cx="172"
        cy="100"
        r="11"
        fill="none"
        stroke="oklch(0.99 0.005 175 / 0.12)"
        strokeWidth="1.5"
      />
      {/* Speaker LEDs — the only mood-tinted parts. */}
      <circle cx="28" cy="100" r="4.5" fill="currentColor" />
      <circle cx="172" cy="100" r="4.5" fill="currentColor" />
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
        stroke={FACE_STROKE}
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

  /* Cups sit outside the body around y=100; face is centred below
     them in the lower half of the capsule. */
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
    face: { eyeY: 126, eyeLeftX: 84, eyeRightX: 116, smileY: 156, smileWidth: 28 },
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

const happyClosedMotion = {
  rest: { opacity: 1 },
  hover: { opacity: 0, transition: { duration: 0.12 } },
};

const happyOpenMotion = {
  rest: { opacity: 0, scale: 0.85 },
  hover: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 360, damping: 18, delay: 0.05 },
  },
};

const happyRestSmileMotion = {
  rest: { opacity: 1 },
  hover: { opacity: 0, transition: { duration: 0.12 } },
};

const happyGrinMotion = {
  rest: { opacity: 0, scaleY: 0.6 },
  hover: {
    opacity: 1,
    scaleY: 1,
    transition: { type: "spring" as const, stiffness: 340, damping: 16, delay: 0.05 },
  },
};

// Sad-mood neutral variants: face stays as-is on hover. The blob still
// bounces slightly (separate variant on the SVG root) so the mascot
// reads as interactive — it just doesn't cheer up.
const staticFaceMotion = {
  rest: { opacity: 1 },
  hover: { opacity: 1 },
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
  const isSad = mood === "sad";

  const gradientId = useId();
  const maskId = useId();
  const noiseId = useId();

  const [forceOpen, setForceOpen] = useState(false);
  const variantState = reduce ? "hover" : undefined;

  // Accent (the colour applied via `currentColor` inside accessories):
  // brand by default, destructive when sad. Hardware paths ignore this
  // by binding to FACE_STROKE directly.
  const accentColor = isSad ? "var(--destructive)" : "var(--brand)";
  const svgStyle: CSSProperties = {
    rotate: `${config.tilt}deg`,
    color: accentColor,
  };

  // When sad, swap the rest-face variants to a no-op on hover so the
  // expression doesn't flip to happy. The awake-face elements aren't
  // rendered at all in sad mode.
  const closedVariants = isSad ? staticFaceMotion : happyClosedMotion;
  const restSmileVariants = isSad ? staticFaceMotion : happyRestSmileMotion;

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
        <motion.g variants={closedVariants} stroke={FACE_STROKE} strokeLinecap="round" fill="none">
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
          variants={restSmileVariants}
          d={
            isSad
              ? `M ${100 - config.face.smileWidth / 2} ${config.face.smileY + 6} q ${config.face.smileWidth / 2} -10 ${config.face.smileWidth} 0`
              : `M ${100 - config.face.smileWidth / 2} ${config.face.smileY} q ${config.face.smileWidth / 2} 12 ${config.face.smileWidth} 0`
          }
          stroke={FACE_STROKE}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Awake face — only rendered when happy. */}
        {!isSad ? (
          <>
            <motion.g variants={happyOpenMotion} fill={FACE_STROKE}>
              <circle cx={config.face.eyeLeftX} cy={config.face.eyeY - 2} r="4" />
              <circle cx={config.face.eyeRightX} cy={config.face.eyeY - 2} r="4" />
            </motion.g>
            <motion.path
              variants={happyGrinMotion}
              style={{ originX: "100px", originY: `${config.face.smileY}px` }}
              d={`M ${100 - (config.face.smileWidth + 14) / 2} ${config.face.smileY - 2} q ${(config.face.smileWidth + 14) / 2} 22 ${config.face.smileWidth + 14} 0`}
              stroke={FACE_STROKE}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : null}

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
