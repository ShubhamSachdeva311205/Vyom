"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface BlurTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  stagger?: number;
}

/**
 * BlurText (React Bits pattern) — unblurs and lifts words into focus
 * when the heading scrolls into the viewport, powered by GSAP ScrollTrigger.
 */
export function BlurText({
  text,
  as: Tag = "h1",
  className,
  stagger = 0.06,
}: BlurTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = el.querySelectorAll<HTMLSpanElement>("[data-blur-word]");
    if (reduce || words.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        {
          opacity: 0,
          y: 14,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.65,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [text, stagger]);

  const words = text.split(" ");

  return (
    <Tag
      ref={containerRef as never}
      className={cn("inline-flex flex-wrap gap-x-[0.28em]", className)}
    >
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          data-blur-word
          className="inline-block will-change-[transform,filter,opacity]"
        >
          {word}
        </span>
      ))}
    </Tag>
  );
}
