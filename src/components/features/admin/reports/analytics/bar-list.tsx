"use client";

/**
 * Dependency-free horizontal bar list — each row is a labelled track whose fill
 * width is proportional to `value`. Used for "sales by city". No chart lib, to
 * keep the admin bundle light (CLAUDE.md §9).
 */
export interface BarListItem {
  label: string;
  value: number;
  /** Optional secondary figure shown muted after the primary value. */
  hint?: string;
}

export function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => {
        const pct = Math.max((item.value / max) * 100, 2);
        return (
          <li key={`${item.label}-${i}`} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="tabular-nums shrink-0">
                {item.value.toLocaleString("en-IN")}
                {item.hint ? (
                  <span className="ml-2 text-caption text-muted-foreground">{item.hint}</span>
                ) : null}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
