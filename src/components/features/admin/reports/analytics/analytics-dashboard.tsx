"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getOrdersByHour,
  getRepeatCustomers,
  getSalesByCity,
  getTopBooks,
  type GeoBreakdown,
  type HourBucket,
  type RepeatStats,
  type TopBookRow,
} from "@/actions/admin-analytics";
import { BarList, type BarListItem } from "./bar-list";
import { HourBarChart } from "./hour-bar-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type PeriodKey = "today" | "7d" | "30d" | "all";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

function rangeFor(p: PeriodKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (p === "today") from.setHours(0, 0, 0, 0);
  else if (p === "7d") from.setDate(from.getDate() - 7);
  else if (p === "30d") from.setDate(from.getDate() - 30);
  else from.setFullYear(2000);
  return { from: from.toISOString(), to: to.toISOString() };
}

interface Data {
  books: TopBookRow[];
  geo: GeoBreakdown;
  repeat: RepeatStats;
  hours: HourBucket[];
}

/** Trigger a client-side CSV download from an array of rows. */
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [data, setData] = useState<Data | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Fetch inside a transition so the state updates happen after the await
  // (not synchronously in the effect body — avoids cascading-render lint).
  const load = useCallback(
    (p: PeriodKey) => {
      startTransition(async () => {
        setError(null);
        const { from, to } = rangeFor(p);
        const [books, geo, repeat, hours] = await Promise.all([
          getTopBooks(from, to),
          getSalesByCity(from, to),
          getRepeatCustomers(from, to),
          getOrdersByHour(from, to),
        ]);
        const failed = [books, geo, repeat, hours].find((r) => !r.success);
        if (failed && !failed.success) {
          setError(failed.error);
          toast.error(failed.error);
          return;
        }
        if (books.success && geo.success && repeat.success && hours.success) {
          setData({ books: books.data, geo: geo.data, repeat: repeat.data, hours: hours.data });
        }
      });
    },
    [startTransition],
  );

  useEffect(() => {
    load(period);
  }, [period, load]);

  const cityItems: BarListItem[] = (data?.geo.cities ?? []).map((c) => ({
    label: c.city,
    value: c.orders,
    hint: formatINR(c.revenuePaise),
  }));

  const hasAny =
    !!data &&
    (data.books.length > 0 ||
      data.geo.cities.length > 0 ||
      data.repeat.totalCustomers > 0 ||
      data.hours.some((h) => h.orders > 0));

  return (
    <Stack gap={6}>
      <Row gap={1} className="flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors min-h-[36px]",
              period === p.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {p.label}
          </button>
        ))}
      </Row>

      {pending && !data ? (
        <div className="py-16 inline-flex w-full items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Crunching analytics…
        </div>
      ) : error && !data ? (
        <Card variant="surface" padding="lg">
          <Stack gap={2} align="center">
            <p className="text-body">Couldn&apos;t load analytics.</p>
            <p className="text-caption text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => load(period)}>
              Try again
            </Button>
          </Stack>
        </Card>
      ) : data && !hasAny ? (
        <Card variant="surface" padding="lg">
          <Stack gap={1} align="center" className="py-10 text-center">
            <p className="text-body">No paid orders in this range yet.</p>
            <p className="text-caption text-muted-foreground">
              Pick a wider period, or come back once orders start landing.
            </p>
          </Stack>
        </Card>
      ) : data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top-selling books */}
          <Card variant="surface" padding="lg" className="lg:col-span-2">
            <Stack gap={4}>
              <Row gap={2} align="center" justify="between" className="flex-wrap">
                <span className="text-eyebrow">Top-selling books</span>
                {data.books.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCsv(
                        "top-books.csv",
                        ["Book", "Units", "Revenue (₹)"],
                        data.books.map((b) => [b.title, b.units, Math.round(b.revenuePaise / 100)]),
                      )
                    }
                  >
                    <Download className="size-4" aria-hidden="true" />
                    CSV
                  </Button>
                ) : null}
              </Row>
              {data.books.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-caption text-muted-foreground">
                        <th className="py-2 pr-3 font-normal">#</th>
                        <th className="py-2 pr-3 font-normal">Book</th>
                        <th className="py-2 pr-3 text-right font-normal">Units</th>
                        <th className="py-2 text-right font-normal">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.books.map((b, i) => (
                        <tr key={b.bookId} className="border-b border-border/50 last:border-0">
                          <td className="py-2 pr-3 tabular-nums text-muted-foreground">{i + 1}</td>
                          <td className="py-2 pr-3">{b.title}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{b.units}</td>
                          <td className="py-2 text-right tabular-nums">
                            {formatINR(b.revenuePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-body text-muted-foreground">
                  No book sales in this range.
                </p>
              )}
            </Stack>
          </Card>

          {/* Sales by city */}
          <Card variant="surface" padding="lg">
            <Stack gap={4}>
              <Row gap={2} align="center" justify="between" className="flex-wrap">
                <span className="text-eyebrow">Sales by city</span>
                {data.geo.cities.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCsv(
                        "sales-by-city.csv",
                        ["City", "Orders", "Revenue (₹)"],
                        data.geo.cities.map((c) => [
                          c.city,
                          c.orders,
                          Math.round(c.revenuePaise / 100),
                        ]),
                      )
                    }
                  >
                    <Download className="size-4" aria-hidden="true" />
                    CSV
                  </Button>
                ) : null}
              </Row>
              {cityItems.length > 0 ? (
                <BarList items={cityItems} />
              ) : (
                <p className="py-8 text-center text-body text-muted-foreground">
                  No shipping cities recorded yet.
                </p>
              )}
            </Stack>
          </Card>

          {/* Top pincodes */}
          <Card variant="surface" padding="lg">
            <Stack gap={4}>
              <span className="text-eyebrow">Top pincodes</span>
              {data.geo.pincodes.length > 0 ? (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {data.geo.pincodes.map((p) => (
                    <li
                      key={p.pincode}
                      className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-0"
                    >
                      <span className="tabular-nums">{p.pincode}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {p.orders} order{p.orders === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-body text-muted-foreground">
                  No pincodes recorded yet.
                </p>
              )}
            </Stack>
          </Card>

          {/* Repeat customers */}
          <Card variant="surface" padding="lg">
            <Stack gap={4}>
              <span className="text-eyebrow">Repeat customers</span>
              <Row gap={6} className="flex-wrap">
                <Stack gap={1}>
                  <span className="text-caption text-muted-foreground">Repeat rate</span>
                  <span className="text-headline tabular-nums">
                    {(data.repeat.repeatRate * 100).toFixed(0)}%
                  </span>
                </Stack>
                <Stack gap={1}>
                  <span className="text-caption text-muted-foreground">Customers</span>
                  <span className="text-headline tabular-nums">
                    {data.repeat.totalCustomers}
                  </span>
                </Stack>
                <Stack gap={1}>
                  <span className="text-caption text-muted-foreground">Repeat buyers</span>
                  <span className="text-headline tabular-nums">
                    {data.repeat.repeatCustomers}
                  </span>
                </Stack>
              </Row>
              {data.repeat.topRepeat.length > 0 ? (
                <Stack gap={2}>
                  <span className="text-caption text-muted-foreground">Top repeat buyers</span>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {data.repeat.topRepeat.map((r) => (
                      <li
                        key={r.email}
                        className="flex items-center justify-between gap-3 border-b border-border/50 pb-1.5 last:border-0"
                      >
                        <span className="truncate">{r.email}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {r.orders} orders
                        </span>
                      </li>
                    ))}
                  </ul>
                </Stack>
              ) : (
                <p className="text-caption text-muted-foreground">
                  No repeat buyers yet in this range.
                </p>
              )}
            </Stack>
          </Card>

          {/* Orders by hour */}
          <Card variant="surface" padding="lg">
            <Stack gap={4}>
              <Stack gap={1}>
                <span className="text-eyebrow">Orders by hour (IST)</span>
                <span className="text-caption text-muted-foreground">
                  When customers actually buy — use it to time ads.
                </span>
              </Stack>
              <HourBarChart buckets={data.hours} />
            </Stack>
          </Card>
        </div>
      ) : null}
    </Stack>
  );
}
