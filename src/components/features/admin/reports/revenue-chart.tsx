"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import type { SalesPoint } from "@/actions/admin-reports";

/**
 * Dependency-free SVG bar chart of revenue per bucket. Admin-only; kept hand-
 * rolled (no recharts) to stay light. Hover a bar for the exact figure.
 */
export function RevenueChart({ points }: { points: SalesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-body text-muted-foreground">
        No sales in this range yet.
      </p>
    );
  }

  const max = Math.max(...points.map((p) => p.revenuePaise), 1);
  const W = 100; // viewBox width units
  const H = 48; // viewBox height units
  const gap = points.length > 1 ? 1.5 : 0;
  // Cap bar width so a handful of points read as bars, not full-width blocks.
  const barW = Math.min((W - gap * (points.length - 1)) / points.length, 7);
  // Label only ~8 ticks to avoid crowding.
  const tickEvery = Math.ceil(points.length / 8);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H + 8}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Revenue over time"
      >
        {points.map((p, i) => {
          const h = (p.revenuePaise / max) * H;
          const x = i * (barW + gap);
          const active = hover === i;
          return (
            <g key={p.key}>
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
              {/* invisible full-height hit area for easier hover */}
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
        {points.map((p, i) =>
          i % tickEvery === 0 ? (
            <span key={p.key} className="tabular-nums">
              {p.label}
            </span>
          ) : (
            <span key={p.key} />
          ),
        )}
      </div>
      {hover != null && (
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
          <span className="font-medium">{points[hover].label}</span> ·{" "}
          {formatINR(points[hover].revenuePaise)} · {points[hover].orders} order
          {points[hover].orders === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
