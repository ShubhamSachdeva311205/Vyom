"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
} as const;

interface StarRatingProps {
  /** 0–5, may be fractional in read-only mode (e.g. 4.3). */
  value: number;
  /** Provide to make it interactive (whole-star selection). */
  onChange?: (value: number) => void;
  count?: number;
  size?: keyof typeof SIZES;
  /** Hidden input name so the value submits with a form. */
  name?: string;
  readOnly?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Star rating — read-only (supports fractional fill for an average) and
 * interactive (click / arrow-key selection). Accessible: the interactive
 * variant is a radiogroup of buttons; read-only is an img with a label.
 */
export function StarRating({
  value,
  onChange,
  count = 5,
  size = "md",
  name,
  readOnly,
  className,
  "aria-label": ariaLabel,
}: StarRatingProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const interactive = !readOnly && typeof onChange === "function";
  const shown = hover ?? value;
  const sizeClass = SIZES[size];

  if (!interactive) {
    // Read-only: render `count` stars, filling each by how much of `value`
    // falls within it (so 4.3 ⇒ first 4 full, 5th 30% filled).
    return (
      <span
        role="img"
        aria-label={ariaLabel ?? `Rated ${value.toFixed(1)} out of ${count}`}
        className={cn("inline-flex items-center gap-0.5", className)}
      >
        {Array.from({ length: count }, (_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className={cn("relative", sizeClass)} aria-hidden="true">
              <Star className={cn(sizeClass, "absolute inset-0 text-border")} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className={cn(sizeClass, "fill-brand text-brand")} />
                </span>
              )}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span
      role="radiogroup"
      aria-label={ariaLabel ?? "Your rating"}
      className={cn("inline-flex items-center gap-1", className)}
      onMouseLeave={() => setHover(null)}
    >
      {name && <input type="hidden" name={name} value={value} />}
      {Array.from({ length: count }, (_, i) => {
        const starValue = i + 1;
        const active = shown >= starValue;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
            id={`${id}-${starValue}`}
            className={cn(
              "rounded-sm p-0.5 transition-transform",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "motion-safe:hover:scale-110",
            )}
            onMouseEnter={() => setHover(starValue)}
            onFocus={() => setHover(starValue)}
            onBlur={() => setHover(null)}
            onClick={() => onChange!(starValue)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange!(Math.min(count, value + 1));
              } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange!(Math.max(1, value - 1));
              }
            }}
          >
            <Star
              className={cn(
                sizeClass,
                active ? "fill-brand text-brand" : "text-border",
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </span>
  );
}
