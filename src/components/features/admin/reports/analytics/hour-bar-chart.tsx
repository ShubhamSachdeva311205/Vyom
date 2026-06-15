"use client";

import { useState } from "react";
import type { HourBucket } from "@/actions/admin-analytics";

/**
 * Dependency-free SVG bar chart of paid-order counts per hour-of-day (0–23,
 * IST). Kept hand-rolled (no chart lib) to honour the perf budget. Hover a bar
 * for the exact count. Mirrors revenue-chart.tsx.
 */
function hourLabel(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

export function HourBarChart({ buckets }: { buckets: HourBucket[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...buckets.map((b) => b.orders), 1);
  const W = 100;
  const H = 48;
  const gap = 1.2;
  const barW = (W - gap * (buckets.length - 1)) / buckets.length;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H + 8}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Orders by hour of day"
      >
        {buckets.map((b, i) => {
          const h = (b.orders / max) * H;
          const x = i * (barW + gap);
          const active = hover === i;
          return (
            <g key={b.hour}>
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={Math.max(h, 0.4)}
                rx={0.6}
                className={active ? "fill-foreground" : "fill-brand"}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <rect
                x={x}
                y={0}
                width={barW}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {buckets.map((b, i) =>
          i % 3 === 0 ? (
            <span key={b.hour} className="tabular-nums">
              {hourLabel(b.hour)}
            </span>
          ) : (
            <span key={b.hour} />
          ),
        )}
      </div>
      {hover != null && (
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md whitespace-nowrap">
          <span className="font-medium">{hourLabel(buckets[hover].hour)} IST</span> ·{" "}
          {buckets[hover].orders} order{buckets[hover].orders === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
