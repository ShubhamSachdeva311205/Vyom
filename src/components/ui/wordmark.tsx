import { Eczar } from "next/font/google";
import { cn } from "@/lib/utils";

// Brand logo typeface — Eczar ExtraBold, rendered in Devanagari (व्योम).
const eczar = Eczar({ subsets: ["latin", "devanagari"], weight: "800", display: "swap" });

/**
 * Wordmark — the Vyom brand logo lockup. Renders the Devanagari "व्योम"
 * in Eczar ExtraBold and exposes an accessible name of "Vyom" (Latin) so
 * screen readers announce the brand rather than reading the glyphs.
 *
 * Shared by the navbar, footer, and any other logo lockup. Pass a
 * className for sizing (e.g. `text-lg`); colour inherits via currentColor.
 * Presentational + client-safe — usable from server or client components.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Vyom"
      className={cn(
        eczar.className,
        "inline-block leading-none tracking-[-0.01em]",
        className,
      )}
    >
      व्योम
    </span>
  );
}
