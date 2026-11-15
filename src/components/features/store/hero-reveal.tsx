"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";

// Read `(pointer: fine)` without a set-state-in-effect (desktop vs touch).
function usePointerFine(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: fine)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
}

export interface HeroRevealProps {
  colorSrc?: string;
  outlineSrc?: string;
}

/**
 * Storefront Hero "sketch → colour" reveal (#91).
 *
 * Powered by GSAP's unified ticker + `gsap.quickTo` spring-like cursor
 * interpolation (synced with Lenis smooth scroll).
 *  - Desktop (fine pointer): reveal centres on the cursor with a soft eased trail.
 *  - Touch / mobile: reveal fans out from the centre of the artwork as you scroll.
 *  - prefers-reduced-motion: full colour shown immediately.
 */
export function HeroReveal({
  colorSrc = "/demo/hero-color.webp",
  outlineSrc = "/demo/hero-outline.webp",
}: HeroRevealProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const finePointer = usePointerFine();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = finePointer;

    if (reduce) {
      if (colorRef.current) {
        colorRef.current.style.webkitMaskImage = "none";
        colorRef.current.style.maskImage = "none";
      }
      return;
    }

    const pos = { x: 50, y: 50 };
    const xTo = gsap.quickTo(pos, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(pos, "y", { duration: 0.45, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      const el = heroRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width) * 100);
      yTo(((e.clientY - r.top) / r.height) * 100);
    }

    const updateMask = () => {
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / (window.innerHeight * 1.1)),
      );
      const cx = fine ? pos.x : 50;
      const cy = fine ? pos.y : 50;
      const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 1.15;
      const eased = Math.pow(progress, 1.65);
      const r = 65 + eased * maxR;
      const mask = `radial-gradient(circle ${r}px at ${cx}% ${cy}%, #000 0%, #000 68%, transparent 100%)`;

      if (colorRef.current) {
        colorRef.current.style.webkitMaskImage = mask;
        colorRef.current.style.maskImage = mask;
      }
      if (trailRef.current && fine) {
        trailRef.current.style.left = `${cx}%`;
        trailRef.current.style.top = `${cy}%`;
        trailRef.current.style.opacity = progress < 0.96 ? "1" : "0";
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = progress < 0.85 ? "1" : "0";
      }
    };

    gsap.ticker.add(updateMask);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      gsap.ticker.remove(updateMask);
      window.removeEventListener("mousemove", onMove);
    };
  }, [finePointer]);

  return (
    <section
      aria-label="Vyom hand-drawn illustration reveal"
      style={{ height: "240vh" }}
      className="relative -mt-16 bg-white"
    >
      <div ref={heroRef} className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        {/* Base layer: hand-drawn outline sketch */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={outlineSrc}
          alt="Hand-drawn meadow sketch for Vyom"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full select-none object-cover object-bottom"
          draggable={false}
        />

        {/* Top layer: hand-drawn colour illustration, revealed by the growing radial mask */}
        <div
          ref={colorRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            WebkitMaskImage:
              "radial-gradient(circle 65px at 50% 50%, #000 0%, #000 68%, transparent 100%)",
            maskImage:
              "radial-gradient(circle 65px at 50% 50%, #000 0%, #000 68%, transparent 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={colorSrc}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="h-full w-full select-none object-cover object-bottom"
            draggable={false}
          />
        </div>

        {/* Soft trailing cursor glow (desktop only) */}
        {finePointer ? (
          <div
            ref={trailRef}
            aria-hidden="true"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 96,
              height: 96,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
              mixBlendMode: "overlay",
              transition: "opacity 400ms",
            }}
          />
        ) : null}

        {/* Scroll hint */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-7 left-1/2 z-20 -translate-x-1/2 text-center transition-opacity duration-300"
        >
          <p className="rounded-full bg-white/85 px-4 py-1 text-sm font-medium text-neutral-800 shadow-xs backdrop-blur-sm whitespace-nowrap">
            {finePointer
              ? "Move your cursor · scroll to bring it to life"
              : "Scroll to bring it to life"}
          </p>
          <div className="mx-auto mt-2 h-8 w-5 rounded-full border border-neutral-400 bg-white/75 backdrop-blur-sm">
            <div className="mx-auto mt-1.5 h-1.5 w-1 animate-bounce rounded-full bg-neutral-700" />
          </div>
        </div>
      </div>
    </section>
  );
}
