"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { InventoryFilter } from "@/lib/inventory/constants";

const TABS: Array<{ key: InventoryFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Sold out" },
  { key: "inactive", label: "Inactive" },
];

export function InventoryTabs({
  current,
  counts,
}: {
  current: InventoryFilter;
  counts: Record<InventoryFilter, number>;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  function hrefFor(key: InventoryFilter): string {
    const next = new URLSearchParams(params.toString());
    if (key === "all") next.delete("filter");
    else next.set("filter", key);
    return `${pathname}?${next.toString()}`;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 min-w-max">
        {TABS.map((tab) => {
          const active = current === tab.key;
          const count = counts[tab.key];
          return (
            <li key={tab.key}>
              <Link
                href={hrefFor(tab.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  "min-h-[40px]",
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    active
                      ? "bg-background/20 text-background"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
