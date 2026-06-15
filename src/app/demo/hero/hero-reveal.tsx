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

/**
 * Hero "sketch → colour" reveal (demo, #91).
 *
 * Two stacked full-bleed images: the outline sketch as the base, the colour
 * image on top masked by a radial gradient. Scrolling grows the mask radius so
 * colour paints in over the sketch; a few screens of scroll later you reach the
 * About section.
 *  - Desktop (fine pointer): the reveal centres on the cursor, with a soft
 *    trailing dot following it.
 *  - Touch: the reveal fans out from the centre of the image.
 *  - prefers-reduced-motion: colour shown fully, no animation.
 *
 * GPU-cheap: only a CSS mask + transforms animate — no per-pixel canvas work.
 */
export function HeroReveal({
  colorSrc,
  outlineSrc,
}: {
  colorSrc: string;
  outlineSrc: string;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  // cursor + eased trail positions, in % of the hero box
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
      progress.current = Math.min(1, window.scrollY / (window.innerHeight * 1.1));
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
      // Radius grows from a small spotlight to past the diagonal. Ease-in so the
      // spotlight stays small early (you read the sketch) then floods near the end.
      const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 1.1;
      const eased = Math.pow(progress.current, 1.7);
      const r = 40 + eased * maxR;
      const mask = `radial-gradient(circle ${r}px at ${cx}% ${cy}%, #000 0%, #000 68%, transparent 100%)`;
      if (colorRef.current) {
        colorRef.current.style.webkitMaskImage = mask;
        colorRef.current.style.maskImage = mask;
      }
      if (trailRef.current && fine) {
        trailRef.current.style.left = `${trail.current.x}%`;
        trailRef.current.style.top = `${trail.current.y}%`;
        trailRef.current.style.opacity = progress.current < 0.98 ? "1" : "0";
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
    <main className="bg-white text-neutral-900">
      {/* Scroll track — taller than the viewport so the hero stays pinned
          while the reveal plays out. */}
      <section style={{ height: "240vh" }} className="relative">
        <div ref={heroRef} className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Base: the outline sketch */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={outlineSrc}
            alt=""
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
          />
          {/* Top: colour, revealed by the growing mask */}
          <div
            ref={colorRef}
            className="absolute inset-0 h-full w-full"
            style={{
              backgroundImage: `url(${colorSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitMaskImage:
                "radial-gradient(circle 60px at 50% 50%, #000 0%, #000 68%, transparent 100%)",
              maskImage:
                "radial-gradient(circle 60px at 50% 50%, #000 0%, #000 68%, transparent 100%)",
            }}
          />
          {/* Trailing cursor dot (desktop only) */}
          {finePointer ? (
            <div
              ref={trailRef}
              aria-hidden
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 90,
                height: 90,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
                mixBlendMode: "overlay",
                transition: "opacity 400ms",
              }}
            />
          ) : null}

          {/* Wordmark + hint */}
          <div className="pointer-events-none absolute left-6 top-6 z-20">
            <span className="text-2xl font-semibold tracking-tight">Vyom</span>
          </div>
          <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-center">
            <p className="text-sm text-neutral-500">
              {finePointer ? "Move your cursor · scroll to bring it to life" : "Scroll to bring it to life"}
            </p>
            <div className="mx-auto mt-2 h-8 w-5 rounded-full border border-neutral-300">
              <div className="mx-auto mt-1.5 h-1.5 w-1 animate-bounce rounded-full bg-neutral-400" />
            </div>
          </div>
        </div>
      </section>

      {/* About section you reach after the reveal */}
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-24">
        <span className="text-xs uppercase tracking-widest text-neutral-400">About</span>
        <h2 className="text-3xl font-semibold">Stories worth colouring in.</h2>
        <p className="text-neutral-600">
          Vyom makes premium IBDP &amp; IGCSE Hindi study materials — written with care, brought to
          life with colour. This is a UI demo of the landing reveal; the real content, navigation,
          and store come later.
        </p>
        <p className="text-sm text-neutral-400">
          (Placeholder art is a watermarked export — final illustration + its find-edges outline
          drop straight in.)
        </p>
      </section>
    </main>
  );
}
