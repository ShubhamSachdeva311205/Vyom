"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSalesSummary, type SalesSummary } from "@/actions/admin-reports";
import { Badge } from "@/components/ui/badge";
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

export function SalesReport() {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [summary, setSummary] = useState<SalesSummary | null>(null);
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

  const { from, to } = rangeFor(period);
  const csvHref = `/api/admin/orders.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

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
        <Button asChild variant="outline" size="sm">
          <a href={csvHref} target="_blank" rel="noopener noreferrer">
            <Download className="size-4" aria-hidden="true" />
            Download CSV
          </a>
        </Button>
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
          </div>

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
