"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { searchCustomers, type CustomerHit } from "@/actions/admin-customers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function CustomerSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CustomerHit[] | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start(async () => {
      const r = await searchCustomers({ query });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      setHits(r.data);
    });
  }

  return (
    <Stack gap={4}>
      <Card variant="surface" padding="lg">
        <form onSubmit={onSubmit}>
          <Row gap={2} align="end" className="flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <FormField label="Search by email or name">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="name@example.com or a name"
                  required
                />
              </FormField>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
              Search
            </Button>
          </Row>
        </form>
      </Card>

      {hits === null ? null : hits.length === 0 ? (
        <Card variant="surface" padding="none" className="overflow-hidden">
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Try a different email or name."
          />
        </Card>
      ) : (
        <Stack gap={3}>
          {hits.map((c) => (
            <Card key={c.id} variant="surface" padding="lg">
              <Stack gap={4}>
                <Row gap={3} justify="between" align="start" className="flex-wrap">
                  <Stack gap={1}>
                    <span className="text-base font-medium">{c.fullName ?? "—"}</span>
                    <span className="text-caption text-muted-foreground">{c.email}</span>
                  </Stack>
                  <Row gap={4} className="flex-wrap text-sm">
                    <Stack gap={1}>
                      <span className="text-caption text-muted-foreground">Joined</span>
                      <span>{fmtDate(c.createdAt)}</span>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-caption text-muted-foreground">Orders</span>
                      <span className="tabular-nums">{c.orderCount}</span>
                    </Stack>
                    <Stack gap={1}>
                      <span className="text-caption text-muted-foreground">Spent</span>
                      <span className="tabular-nums">{formatINR(c.totalSpentPaise)}</span>
                    </Stack>
                  </Row>
                </Row>

                {c.orders.length > 0 ? (
                  <Stack gap={1}>
                    <span className="text-eyebrow">Orders</span>
                    <ul className="flex flex-col gap-1">
                      {c.orders.map((o) => (
                        <li key={o.id}>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-accent/40 text-sm"
                          >
                            <span className="font-mono">{o.orderNumber}</span>
                            <Row gap={2} align="center">
                              <Badge variant="outline">{o.status}</Badge>
                              <span className="text-caption text-muted-foreground tabular-nums">
                                {fmtDate(o.createdAt)} · {formatINR(o.totalPaise)}
                              </span>
                            </Row>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Stack>
                ) : null}

                {c.grants.length > 0 ? (
                  <Stack gap={1}>
                    <span className="text-eyebrow">Digital access</span>
                    <Row gap={2} className="flex-wrap">
                      {c.grants.map((g) => (
                        <Badge key={g.id} variant={g.revoked ? "outline" : "success"}>
                          {g.bookTitle}
                          {g.revoked ? " (revoked)" : ""}
                        </Badge>
                      ))}
                    </Row>
                  </Stack>
                ) : null}

                <Row>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/access-grants">Manage access →</Link>
                  </Button>
                </Row>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
