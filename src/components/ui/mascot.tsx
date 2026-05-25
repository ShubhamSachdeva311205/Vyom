import { cva, type VariantProps } from "class-variance-authority";
import type { ReactElement, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Mascot — Advaita's "study companions". Three hand-authored SVG
 * characters, kept geometric and abstract so they read as friendly
 * without veering into Pixar territory. Each uses currentColor for the
 * main shape (so it themes via Tailwind text-* utilities) and
 * var(--brand) for a single accent so it picks up the active palette.
 *
 * Easy to swap with proper illustrations later — only the PATHS map
 * changes; the public API stays stable.
 */

const mascotVariants = cva("inline-block shrink-0", {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-20 w-20",
      xl: "h-32 w-32",
    },
    tone: {
      foreground: "text-foreground",
      muted: "text-muted-foreground",
      brand: "text-brand",
      primary: "text-primary",
    },
  },
  defaultVariants: { size: "md", tone: "foreground" },
});

export type MascotName = "bookling" | "stellar" | "lumen";

interface MascotProps
  extends Omit<SVGProps<SVGSVGElement>, "name">,
    VariantProps<typeof mascotVariants> {
  name: MascotName;
  label?: string;
}

const PATHS: Record<MascotName, ReactElement> = {
  /* Bookling — open book with two soft eyes. The reading companion. */
  bookling: (
    <g>
      <path
        d="M6 16 L32 24 L58 16 L58 50 L32 58 L6 50 Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M32 24 L32 58"
        stroke="var(--background)"
        strokeWidth="1.5"
        opacity="0.35"
        strokeLinecap="round"
      />
      <circle cx="20" cy="34" r="2.2" fill="var(--background)" />
      <circle cx="44" cy="34" r="2.2" fill="var(--background)" />
      <path
        d="M16 44 Q20 47 24 44"
        stroke="var(--background)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M40 44 Q44 47 48 44"
        stroke="var(--background)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </g>
  ),

  /* Stellar — soft four-pointed sparkle. The "aha" moment. */
  stellar: (
    <g>
      <path
        d="M32 4
           C 32 22, 34 30, 60 32
           C 34 34, 32 42, 32 60
           C 32 42, 30 34, 4 32
           C 30 30, 32 22, 32 4 Z"
        fill="currentColor"
      />
      <circle cx="32" cy="32" r="3.5" fill="var(--brand)" />
      <circle cx="14" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="52" cy="50" r="1.2" fill="currentColor" opacity="0.5" />
    </g>
  ),

  /* Lumen — crescent moon with a tiny companion star. Night-study calm. */
  lumen: (
    <g>
      <path
        d="M44 34
           A 22 22 0 1 1 22 10
           A 16 16 0 1 0 44 34 Z"
        fill="currentColor"
      />
      <path
        d="M50 12 L51.6 16.2 L56 17.8 L51.6 19.4 L50 23.6 L48.4 19.4 L44 17.8 L48.4 16.2 Z"
        fill="var(--brand)"
      />
    </g>
  ),
};

export function Mascot({
  name,
  size,
  tone,
  label,
  className,
  ...rest
}: MascotProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label}
      className={cn(mascotVariants({ size, tone }), className)}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
