import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export const metadata = { title: "Order details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

type Variant = "default" | "secondary" | "outline" | "success" | "warning" | "pending" | "destructive";
const STATUS: Record<string, { label: string; variant: Variant }> = {
  paid: { label: "Paid", variant: "warning" },
  packed: { label: "Packed", variant: "warning" },
  shipped: { label: "Shipped", variant: "success" },
  delivered: { label: "Delivered", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "outline" },
  refunded: { label: "Refunded", variant: "outline" },
  partially_refunded: { label: "Partially refunded", variant: "outline" },
  on_hold: { label: "On hold", variant: "pending" },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDateTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/dashboard/orders`);

  const service = createServiceClient();
  const lookup = UUID_RE.test(id)
    ? service.from("orders").select("*").eq("id", id)
    : service.from("orders").select("*").eq("order_number", id);
  const { data: order } = await lookup.maybeSingle();

  // Owner-only. Hide abandoned (unpaid) orders from the customer view.
  if (!order || order.user_id !== user.id || order.status === "pending_payment") {
    notFound();
  }

  const { data: items } = await service
    .from("order_items")
    .select("*, book:books(title, slug, cover_image_url)")
    .eq("order_id", order.id);

  const s = STATUS[order.status] ?? { label: order.status, variant: "outline" as Variant };
  const addr = (order.shipping_address ?? null) as {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
  } | null;

  const timeline = [
    { label: "Paid", at: fmtDateTime(order.paid_at) },
    { label: "Packed", at: fmtDateTime(order.packed_at) },
    { label: "Shipped", at: fmtDateTime(order.shipped_at) },
    {
      label: "Delivered",
      at: fmtDateTime((order as unknown as { delivered_at: string | null }).delivered_at),
    },
  ];
  const trackingUrl = (order as unknown as { tracking_url: string | null }).tracking_url;
  const refunded = (order as unknown as { refunded_paise: number | null }).refunded_paise ?? 0;

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={2}>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              All orders
            </Link>
            <Row gap={3} align="center" justify="between" className="flex-wrap">
              <Stack gap={1}>
                <h1 className="text-title font-mono">{order.order_number}</h1>
                <Row gap={2} align="center" className="flex-wrap">
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <span className="text-caption text-muted-foreground">
                    Placed {fmtDateTime(order.created_at)}
                  </span>
                </Row>
              </Stack>
              <Row gap={2}>
                {trackingUrl ? (
                  <Button asChild variant="outline" size="md">
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                      Track shipment
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="md">
                  <a
                    href={`/api/orders/${order.id}/invoice.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Invoice
                  </a>
                </Button>
              </Row>
            </Row>
          </Stack>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Items + totals */}
              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <span className="text-eyebrow">Items</span>
                  <ul className="flex flex-col gap-3">
                    {(items ?? []).map((it) => {
                      const book = it.book as {
                        title?: string;
                        slug?: string;
                        cover_image_url?: string | null;
                      } | null;
                      const cover = book?.cover_image_url ?? `/book-covers/${book?.slug}.webp`;
                      return (
                        <li
                          key={it.id}
                          className="flex items-start gap-3 border-b border-border last:border-b-0 pb-3 last:pb-0"
                        >
                          <div className="size-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                            {book?.slug ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt="" className="size-full object-cover" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">
                              {book?.title ?? "Book"}
                            </p>
                            <p className="text-caption text-muted-foreground tabular-nums">
                              Qty {it.quantity} · {formatINR(it.unit_price_paise)} each
                            </p>
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            {formatINR(it.unit_price_paise * it.quantity)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <dl className="border-t border-border pt-3 grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="text-right tabular-nums">{formatINR(order.subtotal_paise)}</dd>
                    {order.discount_paise > 0 ? (
                      <>
                        <dt className="text-muted-foreground">
                          Discount
                          {(order as unknown as { coupon_code: string | null }).coupon_code
                            ? ` (${(order as unknown as { coupon_code: string }).coupon_code})`
                            : ""}
                        </dt>
                        <dd className="text-right tabular-nums text-success">
                          − {formatINR(order.discount_paise)}
                        </dd>
                      </>
                    ) : null}
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd className="text-right tabular-nums">
                      {order.shipping_paise === 0 ? "Free" : formatINR(order.shipping_paise)}
                    </dd>
                    <dt className="pt-1 text-base font-medium border-t border-border mt-1">Total</dt>
                    <dd className="pt-1 text-base font-semibold tabular-nums text-right border-t border-border mt-1">
                      {formatINR(order.total_paise)}
                    </dd>
                    {refunded > 0 ? (
                      <>
                        <dt className="text-muted-foreground">Refunded</dt>
                        <dd className="text-right tabular-nums">− {formatINR(refunded)}</dd>
                      </>
                    ) : null}
                  </dl>
                </Stack>
              </Card>

              {/* Shipping address */}
              {addr ? (
                <Card variant="surface" padding="lg">
                  <Stack gap={2}>
                    <span className="text-eyebrow">Shipping to</span>
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {[
                        addr.name,
                        addr.line1,
                        addr.line2,
                        [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
                        addr.phone ? `Phone: ${addr.phone}` : null,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                  </Stack>
                </Card>
              ) : null}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <span className="text-eyebrow">Status</span>
                  <ol className="flex flex-col gap-2 text-sm">
                    {timeline.map((step) => (
                      <li key={step.label} className="flex items-baseline justify-between gap-3">
                        <span className={step.at ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {step.label}
                        </span>
                        <span className="text-caption text-muted-foreground tabular-nums text-right">
                          {step.at ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Stack>
              </Card>

              <Card variant="surface" padding="lg">
                <Stack gap={2}>
                  <span className="text-eyebrow">Digital companions</span>
                  <p className="text-caption text-muted-foreground">
                    Audio + answer keys for books in this order are in your{" "}
                    <Link href="/dashboard/library" className="underline">
                      library
                    </Link>
                    .
                  </p>
                </Stack>
              </Card>
            </div>
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
