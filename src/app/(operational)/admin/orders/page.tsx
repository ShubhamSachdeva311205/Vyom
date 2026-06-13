import Link from "next/link";
import { Inbox } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { OrdersFilters } from "@/components/features/admin/orders-filters";
import { OrderStatusBadge } from "@/components/features/admin/order-status-badge";
import { AbandonedBanner } from "@/components/features/admin/abandoned-banner";
import { getAbandonedCount, getOrderStatusCounts, listOrders } from "@/actions/admin-orders";
import { ORDER_STATUS_VALUES, type OrderStatusV2 } from "@/lib/orders/labels";
import { formatINR } from "@/lib/format";

export const metadata = { title: "Orders · Admin" };

interface SearchParams {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: string;
}

function parseStatus(raw: string | undefined): OrderStatusV2 | undefined {
  if (!raw) return undefined;
  return (ORDER_STATUS_VALUES as readonly string[]).includes(raw)
    ? (raw as OrderStatusV2)
    : undefined;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const q = (sp.q ?? "").trim();
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));

  const [listResult, countsResult, abandonedResult] = await Promise.all([
    listOrders({
      status,
      search: q || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
    }),
    getOrderStatusCounts(),
    getAbandonedCount(),
  ]);

  const counts = countsResult.success ? countsResult.data ?? null : null;
  const abandonedCount = abandonedResult.success ? abandonedResult.data?.count ?? 0 : 0;
  const filtersActive = Boolean(status || q || from || to);

  return (
    <Section spacing="default">
      <Container size="wide">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Orders</span>
            <h1 className="text-title">Orders</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Every order Mom needs to pack, ship, or follow up on.
            </p>
          </Stack>

          <AbandonedBanner initialCount={abandonedCount} />

          <OrdersFilters
            counts={counts}
            currentStatus={status ?? "all"}
            currentSearch={q}
            currentFrom={from}
            currentTo={to}
          />

          {!listResult.success ? (
            <ErrorState
              title="Couldn't load orders"
              description={listResult.error}
            />
          ) : !listResult.data || listResult.data.rows.length === 0 ? (
            <Card variant="surface" padding="none" className="overflow-hidden">
              <EmptyState
                icon={Inbox}
                title={filtersActive ? "No orders match these filters" : "No orders yet"}
                description={
                  filtersActive
                    ? "Try clearing filters or widening the date range."
                    : "When customers check out, orders land here in real time."
                }
              />
            </Card>
          ) : (
            <Stack gap={3}>
              <ul className="flex flex-col gap-2">
                {listResult.data.rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="block rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors"
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-center">
                        <Stack gap={1}>
                          <Row gap={2} align="center" className="flex-wrap">
                            <span className="font-mono text-sm font-medium">
                              {row.order_number}
                            </span>
                            <span className="text-caption text-muted-foreground">
                              {fmtDate(row.created_at)}
                            </span>
                            <OrderStatusBadge status={row.status} />
                          </Row>
                          <Row gap={2} align="baseline" className="flex-wrap text-sm">
                            <span className="font-medium">
                              {row.customer_name ?? row.customer_email ?? "—"}
                            </span>
                            {row.shipping_city ? (
                              <span className="text-muted-foreground">· {row.shipping_city}</span>
                            ) : null}
                            {row.shipping_pincode ? (
                              <span className="text-muted-foreground tabular-nums">
                                · {row.shipping_pincode}
                              </span>
                            ) : null}
                          </Row>
                        </Stack>
                        <span className="text-base font-semibold tabular-nums sm:text-right">
                          {formatINR(row.total_paise)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <PaginationFooter
                page={listResult.data.page}
                pageSize={listResult.data.pageSize}
                total={listResult.data.total}
                searchParams={sp}
              />
            </Stack>
          )}
        </Stack>
      </Container>
    </Section>
  );
}

function PaginationFooter({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: SearchParams;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;

  function pageHref(p: number): string {
    const next = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) next.set(k, v);
    });
    next.set("page", String(p));
    return `?${next.toString()}`;
  }

  return (
    <Row gap={2} justify="between" align="center" className="text-sm">
      <span className="text-muted-foreground">
        Page {page} of {lastPage} · {total} order{total === 1 ? "" : "s"}
      </span>
      <Row gap={2}>
        {page > 1 ? (
          <Link
            href={pageHref(page - 1)}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-accent"
          >
            Prev
          </Link>
        ) : null}
        {page < lastPage ? (
          <Link
            href={pageHref(page + 1)}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-accent"
          >
            Next
          </Link>
        ) : null}
      </Row>
    </Row>
  );
}
