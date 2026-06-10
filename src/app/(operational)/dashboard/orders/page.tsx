import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export const metadata = { title: "My Orders" };

type Variant = "default" | "secondary" | "outline" | "success" | "warning" | "pending" | "destructive";
const STATUS: Record<string, { label: string; variant: Variant }> = {
  pending_payment: { label: "Awaiting payment", variant: "pending" },
  paid: { label: "Paid", variant: "warning" },
  packed: { label: "Packed", variant: "warning" },
  shipped: { label: "Shipped", variant: "success" },
  delivered: { label: "Delivered", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "outline" },
  refunded: { label: "Refunded", variant: "outline" },
  partially_refunded: { label: "Part refund", variant: "outline" },
  on_hold: { label: "On hold", variant: "pending" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?next=/dashboard/orders");
  }

  const service = createServiceClient();
  const { data: orders } = await service
    .from("orders")
    .select("id, order_number, status, total_paise, created_at, tracking_url")
    .eq("user_id", user.id)
    .neq("status", "pending_payment") // hide abandoned checkouts
    .order("created_at", { ascending: false });

  // Item counts per order.
  const ids = (orders ?? []).map((o) => o.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: items } = await service
      .from("order_items")
      .select("order_id, quantity")
      .in("order_id", ids);
    for (const it of items ?? []) {
      counts.set(it.order_id, (counts.get(it.order_id) ?? 0) + it.quantity);
    }
  }

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Orders</span>
            <h1 className="text-title">My Orders</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Every order you&apos;ve placed, newest first. Download the tax
              invoice or track a shipment here.
            </p>
          </Stack>

          {!orders || orders.length === 0 ? (
            <Card variant="surface" padding="none" className="overflow-hidden">
              <EmptyState
                icon={Package}
                title="No orders yet"
                description="When you buy a book, it'll show up here with its invoice + tracking."
              />
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((o) => {
                const s = STATUS[o.status] ?? { label: o.status, variant: "outline" as Variant };
                const qty = counts.get(o.id) ?? 0;
                const trackingUrl = (o as unknown as { tracking_url: string | null }).tracking_url;
                return (
                  <li key={o.id}>
                    <Card variant="surface" padding="lg">
                      <Row gap={3} justify="between" align="start" className="flex-wrap">
                        <Stack gap={1}>
                          <Row gap={2} align="center" className="flex-wrap">
                            <Link
                              href={`/dashboard/orders/${o.id}`}
                              className="font-mono text-sm font-medium hover:underline"
                            >
                              {o.order_number}
                            </Link>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </Row>
                          <span className="text-caption text-muted-foreground">
                            {fmtDate(o.created_at)} · {qty} item{qty === 1 ? "" : "s"} ·{" "}
                            {formatINR(o.total_paise)}
                          </span>
                        </Stack>
                        <Row gap={2} className="flex-wrap">
                          {trackingUrl ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                Track
                              </a>
                            </Button>
                          ) : null}
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={`/api/orders/${o.id}/invoice.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="size-4" aria-hidden="true" />
                              Invoice
                            </a>
                          </Button>
                        </Row>
                      </Row>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
