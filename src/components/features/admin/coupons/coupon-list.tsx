"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCoupon, type CouponRow } from "@/actions/admin-coupons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stack, Row } from "@/components/layouts/stack";
import { cn } from "@/lib/utils";

function status(row: CouponRow): { label: string; variant: "success" | "outline" | "destructive" | "warning" } {
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { label: "Expired", variant: "outline" };
  }
  if (row.max_uses !== null && row.uses_count >= row.max_uses) {
    return { label: "Used up", variant: "outline" };
  }
  return { label: "Active", variant: "success" };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function CouponList({
  rows,
  variant,
}: {
  rows: CouponRow[];
  variant: "built-in" | "vendor";
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <Card variant="surface" padding="none" className="overflow-hidden">
        <EmptyState
          icon={Tag}
          title={variant === "vendor" ? "No vendor codes yet" : "No codes"}
          description={
            variant === "vendor"
              ? "Use the generator above to mint a code for a partner or vendor."
              : "Built-in codes are seeded via DB migration."
          }
        />
      </Card>
    );
  }

  function copy(code: string) {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 1600);
    });
  }

  function onDelete(code: string) {
    if (!confirm(`Delete code ${code}? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteCoupon({ code });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Code deleted.");
      router.refresh();
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const s = status(row);
        const usage =
          row.max_uses === null
            ? `${row.uses_count} used`
            : `${row.uses_count} / ${row.max_uses} used`;
        return (
          <li key={row.id}>
            <div
              className={cn(
                "rounded-lg border border-border bg-card p-3",
                "grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-center",
              )}
            >
              <Stack gap={1}>
                <Row gap={2} align="center" className="flex-wrap">
                  <code className="font-mono text-sm font-semibold px-2 py-1 rounded bg-muted">
                    {row.code}
                  </code>
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <span className="text-sm font-medium">
                    {row.discount_percent}% off
                  </span>
                </Row>
                <Row gap={3} className="flex-wrap text-caption text-muted-foreground">
                  {row.notes ? <span>{row.notes}</span> : null}
                  <span className="tabular-nums">{usage}</span>
                  <span>created {fmtDate(row.created_at)}</span>
                  {row.expires_at ? (
                    <span>expires {fmtDate(row.expires_at)}</span>
                  ) : null}
                </Row>
              </Stack>
              <Row gap={2} className="sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copy(row.code)}
                >
                  {copied === row.code ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                  {copied === row.code ? "Copied" : "Copy"}
                </Button>
                {variant === "vendor" && row.uses_count === 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(row.code)}
                    disabled={pending}
                    aria-label={`Delete ${row.code}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </Row>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
