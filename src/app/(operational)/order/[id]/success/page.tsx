import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export const metadata = { title: "Order confirmed" };

interface SuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderSuccessPage({ params }: SuccessPageProps) {
  const { id } = await params;

  // Require auth — order pages are private to the buyer.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/sign-in?next=/order/${id}/success`);
  }

  // Fetch with service role + owner check (cleaner than wiring RLS for
  // this one-off; the inline ownership check is the security gate).
  const service = createServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.user_id !== user.id) {
    notFound();
  }

  const { data: items } = await service
    .from("order_items")
    .select("*, book:books(slug,title,subtitle,has_audio,has_answer_key)")
    .eq("order_id", id);

  const lineItems = items ?? [];

  return (
    <Section spacing="default">
      <Container size="form">
        <Stack gap={6}>
          <Stack gap={3} align="start">
            <div className="rounded-full bg-success/10 text-success p-2.5">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </div>
            <Stack gap={2}>
              <span className="text-eyebrow">Order confirmed</span>
              <h1 className="text-title">Thanks for the order.</h1>
              <p className="text-body text-muted-foreground">
                We&apos;ll start packing it shortly. You&apos;ll get an email
                the moment it ships with a Delhivery tracking link.
              </p>
            </Stack>
          </Stack>

          <Card variant="surface" padding="lg">
            <Stack gap={4}>
              <Row align="center" justify="between">
                <div>
                  <p className="text-caption">Order number</p>
                  <p className="text-mono">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-caption">Status</p>
                  <p className="text-sm font-medium capitalize">
                    {order.status.replace("_", " ")}
                  </p>
                </div>
              </Row>

              <div className="border-t border-border pt-4">
                <Stack gap={3}>
                  {lineItems.map((item) => {
                    const book = item.book as
                      | {
                          slug: string;
                          title: string;
                          subtitle: string | null;
                          has_audio: boolean;
                          has_answer_key: boolean;
                        }
                      | null;
                    if (!book) return null;
                    return (
                      <Row key={item.id} gap={3} align="start">
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={`/book-covers/${book.slug}.webp`}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <Stack gap={1} className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 leading-snug">
                            {book.title}
                          </p>
                          <p className="text-caption">
                            Qty {item.quantity} · {formatINR(item.unit_price_paise)} each
                          </p>
                        </Stack>
                        <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                          {formatINR(item.unit_price_paise * item.quantity)}
                        </span>
                      </Row>
                    );
                  })}
                </Stack>
              </div>

              <div className="border-t border-border pt-4">
                <Stack gap={2}>
                  <BreakdownRow label="Subtotal" amount={order.subtotal_paise} />
                  {order.discount_paise > 0 ? (
                    <BreakdownRow
                      label="Coupon discount"
                      amount={-order.discount_paise}
                      muted
                    />
                  ) : null}
                  <BreakdownRow
                    label="Shipping"
                    amount={order.shipping_paise}
                    note={order.shipping_paise === 0 ? "Free" : undefined}
                  />
                  {order.tax_paise > 0 ? (
                    <BreakdownRow label="GST" amount={order.tax_paise} muted />
                  ) : null}
                  <div className="border-t border-border pt-2">
                    <Row align="center" justify="between">
                      <span className="text-headline">Total</span>
                      <span className="text-headline tabular-nums">
                        {formatINR(order.total_paise)}
                      </span>
                    </Row>
                  </div>
                </Stack>
              </div>
            </Stack>
          </Card>

          <Stack gap={3}>
            <p className="text-body text-muted-foreground">
              A receipt will hit your inbox once Phase 7 (transactional
              emails) is live. In the meantime, this page is your receipt.
            </p>
            <Row gap={3}>
              <Button asChild size="md">
                <Link href="/dashboard">
                  View my orders
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="md">
                <Link href="/store">Keep browsing</Link>
              </Button>
            </Row>
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
}

function BreakdownRow({
  label,
  amount,
  note,
  muted,
}: {
  label: string;
  amount: number;
  note?: string;
  muted?: boolean;
}) {
  return (
    <Row align="center" justify="between">
      <span className={muted ? "text-body text-muted-foreground" : "text-body"}>
        {label}
      </span>
      <span className="text-sm tabular-nums">
        {note ?? formatINR(amount)}
      </span>
    </Row>
  );
}
