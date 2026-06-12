"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSalesSummary,
  getSalesTimeSeries,
  type Granularity,
  type SalesPoint,
  type SalesSummary,
} from "@/actions/admin-reports";
import { RevenueChart } from "./revenue-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

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

export function SalesReport() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [series, setSeries] = useState<SalesPoint[] | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const { from, to } = rangeFor(period);
    start(async () => {
      const r = await getSalesSummary(from, to);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      setSummary(r.data);
    });
  }, [period]);

  useEffect(() => {
    const { from, to } = rangeFor(period);
    getSalesTimeSeries(from, to, granularity).then((r) => {
      if (r.success) setSeries(r.data);
    });
  }, [period, granularity]);

  const { from, to } = rangeFor(period);
  const q = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const csvHref = `/api/admin/orders.csv?${q}`;
  const xlsxHref = `/api/admin/orders.xlsx?${q}`;

  return (
    <Stack gap={6}>
      <Row gap={2} justify="between" align="center" className="flex-wrap">
        <Row gap={1} className="flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                period === p.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {p.label}
            </button>
          ))}
        </Row>
        <Row gap={2}>
          <Button asChild variant="outline" size="sm">
            <a href={csvHref} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" aria-hidden="true" />
              CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={xlsxHref} target="_blank" rel="noopener noreferrer">
              <Download className="size-4" aria-hidden="true" />
              Excel
            </a>
          </Button>
        </Row>
      </Row>

      {pending && !summary ? (
        <div className="py-16 inline-flex items-center gap-2 text-muted-foreground justify-center w-full">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Crunching numbers…
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Net revenue" value={formatINR(summary.netPaise)} hint="after refunds" />
            <Kpi label="Orders" value={String(summary.orderCount)} />
            <Kpi label="Units sold" value={String(summary.unitsSold)} />
            <Kpi label="Avg order value" value={formatINR(summary.aovPaise)} />
            <Kpi label="Gross revenue" value={formatINR(summary.grossPaise)} />
            <Kpi label="Refunded" value={formatINR(summary.refundedPaise)} />
            <Kpi label="Shipping collected" value={formatINR(summary.shippingCollectedPaise)} />
            <Kpi label="Discounts given" value={formatINR(summary.discountGivenPaise)} />
            <Kpi label="Razorpay fees" value={formatINR(summary.feesPaise)} />
            <Kpi
              label="Cost of goods"
              value={formatINR(summary.cogsPaise)}
              hint={summary.cogsPaise === 0 ? "set book costs in inventory" : undefined}
            />
            <Kpi label="Net profit" value={formatINR(summary.netProfitPaise)} hint="net − fees − COGS" />
          </div>

          {/* Revenue chart */}
          <Card variant="surface" padding="lg">
            <Stack gap={4}>
              <Row gap={2} align="center" justify="between" className="flex-wrap">
                <span className="text-eyebrow">Revenue over time</span>
                <Row gap={1}>
                  {GRANULARITIES.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGranularity(g.key)}
                      className={cn(
                        "rounded-full px-3 py-1 text-sm transition-colors",
                        granularity === g.key
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </Row>
              </Row>
              {series ? <RevenueChart points={series} /> : null}
            </Stack>
          </Card>

          {Object.keys(summary.byStatus).length > 0 ? (
            <Card variant="surface" padding="lg">
              <Stack gap={2}>
                <span className="text-eyebrow">Orders by status</span>
                <Row gap={2} className="flex-wrap">
                  {Object.entries(summary.byStatus).map(([status, n]) => (
                    <Badge key={status} variant="outline">
                      {status}: {n}
                    </Badge>
                  ))}
                </Row>
              </Stack>
            </Card>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card variant="surface" padding="lg">
      <Stack gap={1}>
        <span className="text-caption text-muted-foreground">{label}</span>
        <span className="text-headline tabular-nums">{value}</span>
        {hint ? <span className="text-caption text-muted-foreground">{hint}</span> : null}
      </Stack>
    </Card>
  );
}
