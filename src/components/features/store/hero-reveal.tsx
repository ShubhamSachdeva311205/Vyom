"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

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
 * Two stacked full-bleed hand-drawn illustrations: the outline sketch as the
 * base, and the coloured artwork on top masked by a radial gradient. Scrolling
 * grows the mask radius so colour paints in over the sketch before transitioning
 * into the About section and storefront below.
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

  // Cursor + eased trail positions, in % of the hero box
  const cursor = useRef({ x: 50, y: 50 });
  const trail = useRef({ x: 50, y: 50 });
  const progress = useRef(0);
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

    function onScroll() {
      // Fully revealed after ~1.1 viewport-heights of scrolling.
      progress.current = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 1.1)));
    }

    function onMove(e: MouseEvent) {
      const el = heroRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      cursor.current = {
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      };
    }

    let raf = 0;
    const tick = () => {
      // Centre: cursor on desktop, image centre on touch.
      const target = fine ? cursor.current : { x: 50, y: 50 };
      // Ease the trail toward the cursor for a soft lag.
      trail.current.x += (target.x - trail.current.x) * 0.12;
      trail.current.y += (target.y - trail.current.y) * 0.12;

      const cx = fine ? trail.current.x : 50;
      const cy = fine ? trail.current.y : 50;
      // Radius grows from a spotlight to past the viewport diagonal.
      const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 1.15;
      const eased = Math.pow(progress.current, 1.65);
      const r = 65 + eased * maxR;
      const mask = `radial-gradient(circle ${r}px at ${cx}% ${cy}%, #000 0%, #000 68%, transparent 100%)`;

      if (colorRef.current) {
        colorRef.current.style.webkitMaskImage = mask;
        colorRef.current.style.maskImage = mask;
      }
      if (trailRef.current && fine) {
        trailRef.current.style.left = `${trail.current.x}%`;
        trailRef.current.style.top = `${trail.current.y}%`;
        trailRef.current.style.opacity = progress.current < 0.96 ? "1" : "0";
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = progress.current < 0.85 ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
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
          className="absolute inset-0 h-full w-full select-none object-cover object-center"
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
            className="h-full w-full select-none object-cover object-center"
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

        {/* Scroll hint pill */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-7 left-1/2 z-20 -translate-x-1/2 text-center transition-opacity duration-300"
        >
          <div className="rounded-full border border-neutral-200/80 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <p className="text-xs sm:text-sm font-medium text-neutral-700 whitespace-nowrap">
              {finePointer
                ? "Move your cursor · scroll to bring it to life"
                : "Scroll to bring it to life"}
            </p>
          </div>
          <div className="mx-auto mt-2 h-8 w-5 rounded-full border border-neutral-400/80 bg-white/60 backdrop-blur-sm">
            <div className="mx-auto mt-1.5 h-1.5 w-1 animate-bounce rounded-full bg-neutral-600" />
          </div>
        </div>
      </div>
    </section>
  );
}
