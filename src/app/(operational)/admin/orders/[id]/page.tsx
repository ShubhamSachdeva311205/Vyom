import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { InvoiceDownloadButton } from "@/components/features/store/invoice-download-button";
import { OrderStatusBadge } from "@/components/features/admin/order-status-badge";
import {
  CopyButton,
  StatusActions,
  TrackingForm,
} from "@/components/features/admin/order-actions";
import { RefundDialog } from "@/components/features/admin/refund-dialog";
import { getOrderDetail } from "@/actions/admin-orders";
import { courierLabel, type OrderStatusV2 } from "@/lib/orders/labels";
import { formatINR } from "@/lib/format";

export const metadata = { title: "Order · Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

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

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  phone?: string | null;
  name?: string | null;
}

function formatAddressBlock(addr: ShippingAddress | null, customerName: string | null): string {
  if (!addr) return customerName ?? "";
  const lines = [
    addr.name || customerName,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
    addr.country,
    addr.phone ? `Phone: ${addr.phone}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getOrderDetail(id);

  if (!result.success) {
    if (result.error === "Order not found.") notFound();
    return (
      <Section spacing="default">
        <Container size="page">
          <ErrorState title="Couldn't load order" description={result.error} />
        </Container>
      </Section>
    );
  }
  if (!result.data) notFound();

  const { order, items, customer } = result.data;
  const addr = (order.shipping_address as ShippingAddress | null) ?? null;
  const addressBlock = formatAddressBlock(addr, customer?.full_name ?? null);
  const status = order.status as OrderStatusV2;

  const timeline: Array<{ label: string; at: string | null }> = [
    { label: "Paid", at: fmtDateTime(order.paid_at) },
    { label: "Packed", at: fmtDateTime(order.packed_at) },
    { label: "Shipped", at: fmtDateTime(order.shipped_at) },
    { label: "Delivered", at: fmtDateTime((order as unknown as { delivered_at: string | null }).delivered_at) },
  ];

  const trackingNumber = (order as unknown as { tracking_number: string | null }).tracking_number;
  const courier = (order as unknown as { courier_name: string | null }).courier_name;

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={2}>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              All orders
            </Link>
            <Row gap={3} align="center" justify="between" className="flex-wrap">
              <Stack gap={1}>
                <h1 className="text-title font-mono">{order.order_number}</h1>
                <Row gap={2} align="center" className="flex-wrap">
                  <OrderStatusBadge status={status} />
                  <span className="text-caption text-muted-foreground">
                    Placed {fmtDateTime(order.created_at)}
                  </span>
                </Row>
              </Stack>
              <InvoiceDownloadButton orderId={order.id} />
            </Row>
          </Stack>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left col — customer + items + totals */}
            <div className="lg:col-span-2 space-y-4">
              {/* Customer + shipping */}
              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <Row gap={3} justify="between" align="start" className="flex-wrap">
                    <Stack gap={1}>
                      <span className="text-eyebrow">Customer</span>
                      <p className="text-base font-medium">
                        {customer?.full_name ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {customer?.email ?? "—"}
                      </p>
                    </Stack>
                    <CopyButton text={customer?.email ?? ""} label="Copy email" />
                  </Row>

                  <div className="border-t border-border pt-3">
                    <Row gap={3} justify="between" align="start" className="flex-wrap">
                      <Stack gap={1}>
                        <span className="text-eyebrow">Shipping</span>
                        {addressBlock ? (
                          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                            {addressBlock}
                          </pre>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No address captured.
                          </p>
                        )}
                      </Stack>
                      {addressBlock ? (
                        <CopyButton text={addressBlock} label="Copy address" />
                      ) : null}
                    </Row>
                  </div>
                </Stack>
              </Card>

              {/* Items */}
              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <span className="text-eyebrow">Items</span>
                  <ul className="flex flex-col gap-3">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 border-b border-border last:border-b-0 pb-3 last:pb-0"
                      >
                        <div className="size-12 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                          {item.book?.cover_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.book.cover_image_url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : null}
                        </div>
                        <Stack gap={1} className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {item.book?.title ?? "Book removed"}
                          </p>
                          {item.book?.subtitle ? (
                            <p className="text-caption text-muted-foreground leading-tight">
                              {item.book.subtitle}
                            </p>
                          ) : null}
                          <p className="text-caption text-muted-foreground tabular-nums">
                            Qty {item.quantity} · {formatINR(item.unit_price_paise)} each
                          </p>
                        </Stack>
                        <span className="text-sm font-medium tabular-nums">
                          {formatINR(item.unit_price_paise * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <dl className="border-t border-border pt-3 grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="text-right tabular-nums">
                      {formatINR(order.subtotal_paise)}
                    </dd>
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
                    {order.tax_paise > 0 ? (
                      <>
                        <dt className="text-muted-foreground">GST</dt>
                        <dd className="text-right tabular-nums">
                          {formatINR(order.tax_paise)}
                        </dd>
                      </>
                    ) : null}
                    <dt className="pt-1 text-base font-medium border-t border-border mt-1">
                      Total
                    </dt>
                    <dd className="pt-1 text-base font-semibold tabular-nums text-right border-t border-border mt-1">
                      {formatINR(order.total_paise)}
                    </dd>
                  </dl>
                </Stack>
              </Card>

              {/* Tracking */}
              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <Row gap={2} justify="between" align="center">
                    <span className="text-eyebrow">Tracking</span>
                    {trackingNumber ? (
                      <span className="text-caption text-muted-foreground">
                        {courierLabel(courier)} · {trackingNumber}
                      </span>
                    ) : null}
                  </Row>
                  <TrackingForm
                    orderId={order.id}
                    initialTrackingNumber={trackingNumber}
                    initialCourier={courier}
                    initialTrackingUrl={order.tracking_url}
                  />
                </Stack>
              </Card>
            </div>

            {/* Right col — actions + timeline */}
            <div className="space-y-4">
              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <span className="text-eyebrow">Actions</span>
                  <StatusActions orderId={order.id} currentStatus={status} />
                  {order.razorpay_payment_id &&
                  status !== "pending_payment" &&
                  status !== "cancelled" &&
                  status !== "refunded" ? (
                    <RefundDialog
                      orderId={order.id}
                      totalPaise={order.total_paise}
                      alreadyRefundedPaise={
                        (order as unknown as { refunded_paise: number | null })
                          .refunded_paise ?? 0
                      }
                      capturedFeePaise={
                        (order as unknown as {
                          non_refundable_fee_paise: number | null;
                        }).non_refundable_fee_paise ?? null
                      }
                    />
                  ) : null}
                </Stack>
              </Card>

              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <span className="text-eyebrow">Timeline</span>
                  <ol className="flex flex-col gap-2 text-sm">
                    {timeline.map((step) => (
                      <li
                        key={step.label}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span
                          className={
                            step.at ? "text-foreground font-medium" : "text-muted-foreground"
                          }
                        >
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

              {order.razorpay_payment_id ? (
                <Card variant="surface" padding="lg">
                  <Stack gap={2}>
                    <span className="text-eyebrow">Payment</span>
                    <p className="text-caption text-muted-foreground break-all">
                      Razorpay #{order.razorpay_payment_id}
                    </p>
                  </Stack>
                </Card>
              ) : null}
            </div>
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
