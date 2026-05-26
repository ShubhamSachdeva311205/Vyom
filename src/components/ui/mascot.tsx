"use client";

/**
 * Mascot — Advaita's study companions.
 *
 * Cast (6 characters, each with a distinct hue):
 *   student  · soft round blob   · emerald  · school collar + tie · opt-in limbs
 *   teacher  · slightly oval     · amber    · glasses
 *   bookworm · tall capsule      · violet   · over-ear headphones (red LED if sad)
 *   wisp     · wide pebble       · coral    · (no accessory)        [formerly "star"]
 *   star     · 5-point star      · gold     · (no accessory)        [NEW]
 *   triangle · rounded triangle  · teal     · (no accessory)        [NEW]
 *
 * Color separation:
 *   - Accessory hardware always FACE_STROKE.
 *   - Accent dots (speaker LED, cap tassel) use currentColor → swaps to
 *     destructive when mood="sad".
 *
 * Storefront-only. Don't import from operational routes.
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

export type MascotName =
  | "student"
  | "teacher"
  | "bookworm"
  | "wisp"
  | "star"
  | "triangle";

interface MascotProps extends VariantProps<typeof wrapperVariants> {
  name: MascotName;
  code?: string;
  hideCoupon?: boolean;
  mood?: "happy" | "sad";
  /** Render stick-figure arms + legs (currently only honoured by `student`). */
  withLimbs?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_CODES: Partial<Record<MascotName, string>> = {
  student: "student10",
  teacher: "teacher10",
};

const FACE_STROKE = "oklch(0.14 0.04 175)";

/* ----------------------------------------------------------------
 * Accessories
 * ---------------------------------------------------------------- */

function CollarAndTieAccessory() {
  // Bigger Peter Pan-style white collar + school tie hanging from the
  // V notch. Tie uses --brand-deep so it picks up the palette; stripes
  // are near-white.
  return (
    <g>
      {/* Collar */}
      <path
        d="M 64 152
           L 136 152
           L 136 178
           L 112 178
           L 100 162
           L 88 178
           L 64 178 Z"
        fill="oklch(0.99 0.005 175)"
        stroke={FACE_STROKE}
        strokeOpacity="0.4"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Tie body */}
      <rect
        x="93"
        y="164"
        width="14"
        height="38"
        rx="2.5"
        fill="var(--brand-deep)"
      />
      {/* Tie knot — a small darker square at the top */}
      <rect
        x="91"
        y="160"
        width="18"
        height="10"
        rx="2"
        fill="var(--brand-deep)"
        stroke={FACE_STROKE}
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      {/* Tie stripes — diagonal */}
      <line
        x1="93"
        y1="178"
        x2="107"
        y2="184"
        stroke="oklch(0.99 0.005 175)"
        strokeWidth="2"
        strokeOpacity="0.8"
      />
      <line
        x1="93"
        y1="190"
        x2="107"
        y2="196"
        stroke="oklch(0.99 0.005 175)"
        strokeWidth="2"
        strokeOpacity="0.8"
      />
    </g>
  );
}

function GlassesAccessory() {
  return (
    <g>
      <rect x="56" y="80" width="36" height="26" rx="11" fill="oklch(0.99 0.01 75 / 0.18)" />
      <rect x="108" y="80" width="36" height="26" rx="11" fill="oklch(0.99 0.01 75 / 0.18)" />
      <g stroke={FACE_STROKE} strokeWidth="3.5" fill="none" strokeLinejoin="round">
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
      <path d="M 56 30 L 100 16 L 144 30 L 100 44 Z" fill={FACE_STROKE} />
      <rect x="74" y="44" width="52" height="4" rx="1" fill={FACE_STROKE} />
      <line x1="138" y1="28" x2="146" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="146" cy="52" r="3" fill="currentColor" />
    </g>
  );
}

function HeadphonesAccessory() {
  // Over-ear cups. Three changes vs the old version:
  //   1. Cups offset slightly toward the head centre (cx 28→32, 172→168)
  //      so they look like they wrap around vs. floating outside.
  //   2. A second thin arc behind/under the cups suggests the back of
  //      the headband — gives 3D depth.
  //   3. Inner darker circle offset toward the inner side of each cup
  //      shows the cup's "inside" facing the head.
  return (
    <g>
      {/* Front band — over the top */}
      <path
        d="M 36 84 Q 100 22 164 84"
        stroke={FACE_STROKE}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Back band — visible peeking behind the head between cups */}
      <path
        d="M 40 110 Q 100 132 160 110"
        stroke={FACE_STROKE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.35"
        fill="none"
      />
      {/* Ear cups */}
      <circle cx="32" cy="100" r="15" fill={FACE_STROKE} />
      <circle cx="168" cy="100" r="15" fill={FACE_STROKE} />
      {/* Inside of cup — small darker circle, offset INWARD toward head */}
      <circle cx="36" cy="100" r="9" fill="oklch(0.06 0.02 175)" />
      <circle cx="164" cy="100" r="9" fill="oklch(0.06 0.02 175)" />
      {/* Speaker LED — accent-tinted via currentColor */}
      <circle cx="36" cy="100" r="4" fill="currentColor" />
      <circle cx="164" cy="100" r="4" fill="currentColor" />
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
  collar: <CollarAndTieAccessory />,
  glasses: <GlassesAccessory />,
  cap: <CapAccessory />,
  headphones: <HeadphonesAccessory />,
  "backpack-strap": <BackpackStrapAccessory />,
};

/* ----------------------------------------------------------------
 * Limbs — stick arms + legs with 3-finger hands. Only honoured by
 * `student` (per Issue #14). Sits behind the body in z-order so the
 * hands curve into view from the sides.
 * ---------------------------------------------------------------- */
function StudentLimbs() {
  return (
    <g stroke={FACE_STROKE} strokeWidth="2.6" strokeLinecap="round" fill="none">
      {/* Left arm — body side at (24, 110), bends down to hand at (4, 144) */}
      <path d="M 24 110 Q 14 124 4 144" />
      {/* Left hand — 3 fingers fanning out */}
      <line x1="4" y1="144" x2="-2" y2="152" />
      <line x1="4" y1="144" x2="4" y2="154" />
      <line x1="4" y1="144" x2="10" y2="152" />

      {/* Right arm — mirrored to (196, 144) */}
      <path d="M 176 110 Q 186 124 196 144" />
      <line x1="196" y1="144" x2="202" y2="152" />
      <line x1="196" y1="144" x2="196" y2="154" />
      <line x1="196" y1="144" x2="190" y2="152" />

      {/* Left leg — out of the bottom-left of the body */}
      <path d="M 70 184 Q 64 196 60 208" />
      {/* Foot — short horizontal stroke */}
      <line x1="56" y1="208" x2="66" y2="208" />

      {/* Right leg */}
      <path d="M 130 184 Q 136 196 140 208" />
      <line x1="134" y1="208" x2="144" y2="208" />
    </g>
  );
}

/* ----------------------------------------------------------------
 * Blob shapes + diversified palettes
 *
 * Each gradient has three oklch stops. Hardcoded (not brand vars) so
 * the cast has visible variety — only `student` keeps the locked brand
 * emerald palette since it's the canonical character.
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
  /* emerald — keeps the locked brand palette */
  student: {
    path:
      "M 102 14 " +
      "C 150 10, 188 44, 186 100 " +
      "C 184 152, 142 188, 92 184 " +
      "C 40 180, 12 144, 14 90 " +
      "C 16 42, 50 18, 102 14 Z",
    gradient: [
      "oklch(0.82 0.16 168)",
      "oklch(0.58 0.18 168)",
      "oklch(0.34 0.14 172)",
    ],
    gradientOrigin: { cx: 32, cy: 28, r: 78 },
    tilt: -4,
    face: { eyeY: 92, eyeLeftX: 72, eyeRightX: 128, smileY: 128, smileWidth: 42 },
    accessory: "collar",
    highlight: { cx: 64, cy: 56, rx: 46, ry: 32 },
  },

  /* amber — warm gold */
  teacher: {
    path:
      "M 100 8 " +
      "C 158 10, 188 46, 188 102 " +
      "C 188 158, 156 192, 100 192 " +
      "C 44 192, 12 158, 12 102 " +
      "C 12 46, 42 10, 100 8 Z",
    gradient: [
      "oklch(0.88 0.13 78)",
      "oklch(0.70 0.17 70)",
      "oklch(0.42 0.13 60)",
    ],
    gradientOrigin: { cx: 38, cy: 24, r: 82 },
    tilt: 3,
    face: { eyeY: 96, eyeLeftX: 74, eyeRightX: 126, smileY: 132, smileWidth: 50 },
    accessory: "glasses",
    highlight: { cx: 74, cy: 50, rx: 46, ry: 34 },
  },

  /* violet-blue */
  bookworm: {
    path:
      "M 100 8 " +
      "C 140 8, 162 36, 162 78 " +
      "C 162 122, 158 162, 144 184 " +
      "C 136 198, 64 198, 56 184 " +
      "C 42 162, 38 122, 38 78 " +
      "C 38 36, 60 8, 100 8 Z",
    gradient: [
      "oklch(0.80 0.13 280)",
      "oklch(0.58 0.18 285)",
      "oklch(0.34 0.15 290)",
    ],
    gradientOrigin: { cx: 36, cy: 22, r: 88 },
    tilt: 0,
    face: { eyeY: 126, eyeLeftX: 84, eyeRightX: 116, smileY: 156, smileWidth: 28 },
    accessory: "headphones",
    highlight: { cx: 66, cy: 44, rx: 36, ry: 30 },
  },

  /* coral / warm pink — was named "star", now "wisp" */
  wisp: {
    path:
      "M 36 60 " +
      "C 56 28, 116 24, 156 38 " +
      "C 192 52, 196 96, 178 124 " +
      "C 156 154, 102 162, 64 154 " +
      "C 28 148, 8 122, 12 88 " +
      "C 16 68, 24 62, 36 60 Z",
    gradient: [
      "oklch(0.86 0.13 30)",
      "oklch(0.66 0.18 22)",
      "oklch(0.42 0.16 18)",
    ],
    gradientOrigin: { cx: 30, cy: 32, r: 92 },
    tilt: 6,
    face: { eyeY: 84, eyeLeftX: 78, eyeRightX: 122, smileY: 116, smileWidth: 40 },
    highlight: { cx: 58, cy: 56, rx: 42, ry: 28 },
  },

  /* gold — NEW. 5-point star with softened peaks via cubic curves. */
  star: {
    path:
      "M 100 14 " +
      "C 108 14, 113 24, 122 70 " +
      "C 124 78, 132 80, 184 78 " +
      "C 192 80, 194 90, 138 116 " +
      "C 132 120, 134 130, 156 184 " +
      "C 152 192, 142 192, 100 152 " +
      "C 58 192, 48 192, 44 184 " +
      "C 66 130, 68 120, 62 116 " +
      "C 6 90, 8 80, 16 78 " +
      "C 68 80, 76 78, 78 70 " +
      "C 87 24, 92 14, 100 14 Z",
    gradient: [
      "oklch(0.94 0.12 95)",
      "oklch(0.78 0.16 88)",
      "oklch(0.50 0.14 78)",
    ],
    gradientOrigin: { cx: 36, cy: 30, r: 86 },
    tilt: 0,
    face: { eyeY: 96, eyeLeftX: 82, eyeRightX: 118, smileY: 124, smileWidth: 28 },
    highlight: { cx: 70, cy: 58, rx: 32, ry: 22 },
  },

  /* teal / cyan — NEW. Rounded-corner triangle pointing up. */
  triangle: {
    path:
      "M 100 16 " +
      "C 110 16, 118 24, 174 156 " +
      "C 178 168, 172 178, 160 178 " +
      "L 40 178 " +
      "C 28 178, 22 168, 26 156 " +
      "C 82 24, 90 16, 100 16 Z",
    gradient: [
      "oklch(0.84 0.11 200)",
      "oklch(0.62 0.14 210)",
      "oklch(0.36 0.11 222)",
    ],
    gradientOrigin: { cx: 36, cy: 36, r: 92 },
    tilt: 0,
    face: { eyeY: 110, eyeLeftX: 84, eyeRightX: 116, smileY: 140, smileWidth: 28 },
    highlight: { cx: 70, cy: 60, rx: 32, ry: 22 },
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
  withLimbs = false,
  label,
  size,
  className,
}: MascotProps) {
  const reduce = useReducedMotion();
  const config = BLOBS[name];
  const couponCode = code ?? DEFAULT_CODES[name];
  const showCoupon = !hideCoupon && Boolean(couponCode);
  const isSad = mood === "sad";
  const showLimbs = withLimbs && name === "student"; // Only student supports limbs (for now)

  const gradientId = useId();
  const maskId = useId();
  const noiseId = useId();

  const [forceOpen, setForceOpen] = useState(false);
  const variantState = reduce ? "hover" : undefined;

  const accentColor = isSad ? "var(--destructive)" : "var(--brand)";
  const svgStyle: CSSProperties = {
    rotate: `${config.tilt}deg`,
    color: accentColor,
  };

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
        viewBox="0 0 200 220"
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
                    : name === "wisp"
                      ? 13
                      : name === "star"
                        ? 17
                        : name === "triangle"
                          ? 19
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

        {/* Limbs first so the body covers the joints */}
        {showLimbs ? <StudentLimbs /> : null}

        <g mask={`url(#${maskId})`}>
          <rect width="200" height="220" fill={`url(#${gradientId})`} />
          <rect width="200" height="220" filter={`url(#${noiseId})`} />
          <ellipse
            cx={config.highlight.cx}
            cy={config.highlight.cy}
            rx={config.highlight.rx}
            ry={config.highlight.ry}
            fill="white"
            opacity="0.18"
          />
        </g>

        {/* Resting face — closed eyes + smile or frown by mood. */}
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

        {/* Awake face — only when happy. */}
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
