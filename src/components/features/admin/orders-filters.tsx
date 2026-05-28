"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StatusCounts } from "@/actions/admin-orders";
import { statusLabel, type OrderStatusV2 } from "@/lib/orders/labels";

type Tab = { key: "all" | OrderStatusV2; label: string };

// Tabs always shown. "Abandoned" (pending_payment) is added at the end
// only when count > 0 — it's intentionally hidden when there's nothing
// to clean up, so it doesn't draw attention away from real orders.
const BASE_TABS: Tab[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: statusLabel("delivered") },
  { key: "on_hold", label: statusLabel("on_hold") },
  { key: "refunded", label: "Refunded" },
  { key: "cancelled", label: "Cancelled" },
];

export function OrdersFilters({
  counts,
  currentStatus,
  currentSearch,
  currentFrom,
  currentTo,
}: {
  counts: StatusCounts | null;
  currentStatus: "all" | OrderStatusV2;
  currentSearch: string;
  currentFrom: string;
  currentTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(currentSearch);
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  // Debounced search → URL.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setDate(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  function tabHref(key: "all" | OrderStatusV2): string {
    const next = new URLSearchParams(params.toString());
    if (key === "all") next.delete("status");
    else next.set("status", key);
    next.delete("page");
    return `${pathname}?${next.toString()}`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Status tabs — horizontal scroll on mobile. */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <ul className="flex gap-1 min-w-max">
          {(() => {
            const tabs: Tab[] = [...BASE_TABS];
            const abandoned = counts?.pending_payment ?? 0;
            // Show "Abandoned" tab only when there's something there OR
            // the user has already filtered to it.
            if (abandoned > 0 || currentStatus === "pending_payment") {
              tabs.push({ key: "pending_payment", label: "Abandoned" });
            }
            return tabs;
          })().map((tab) => {
            const active = currentStatus === tab.key;
            const count = counts ? counts[tab.key] : null;
            return (
              <li key={tab.key}>
                <Link
                  href={tabHref(tab.key)}
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
                  {count !== null ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[10px] tabular-nums",
                        active ? "bg-background/20 text-background" : "bg-background text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Search + date range */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <div className="relative">
          <Search
            className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search order number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search orders"
          />
        </div>
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setDate("from", e.target.value);
          }}
          aria-label="From date"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setDate("to", e.target.value);
          }}
          aria-label="To date"
        />
      </div>
    </div>
  );
}
