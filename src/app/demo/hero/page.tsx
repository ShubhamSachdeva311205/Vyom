import type { Metadata } from "next";
import { Eczar } from "next/font/google";
import { HeroReveal } from "./hero-reveal";

// Brand logo typeface — Eczar ExtraBold, rendered in Devanagari (व्योम).
const eczar = Eczar({ subsets: ["latin", "devanagari"], weight: "800", display: "swap" });

/**
 * STANDALONE UI DEMO (#91) — not wired into the app. A throwaway page to feel
 * out the Vyom hero "sketch → colour" reveal before we build it for real.
 * Art here is a placeholder (KlingAI export, watermarked); swap in the final
 * illustration + its find-edges outline (scripts/find-edges.mjs) later.
 */
export const metadata: Metadata = {
  title: "Hero reveal — demo",
  robots: { index: false, follow: false },
};

export default function HeroDemoPage() {
  return (
    <HeroReveal
      colorSrc="/demo/hero-color.png"
      outlineSrc="/demo/hero-outline.png"
      logoClass={eczar.className}
    />
  );
}
