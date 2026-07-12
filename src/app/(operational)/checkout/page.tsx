import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { CheckoutForm } from "@/components/features/store/checkout-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";
import { getCurrentCart } from "@/lib/cart/queries";
import { paymentsLive } from "@/lib/env";
import { getPublicRazorpayKeyId } from "@/lib/razorpay/client";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  // FFR §A6 — guest checkout is NOT supported. Redirect to sign-in
  // with a next= param so the user lands back here after auth (and
  // their cart merges automatically per Phase 3.2).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?next=/checkout");
  }

  const cart = await getCurrentCart();
  const items = cart?.items ?? [];
  const subtotalPaise = items.reduce(
    (sum, it) => sum + it.book.price_paise * it.quantity,
    0,
  );
  const totalUnits = items.reduce((sum, it) => sum + it.quantity, 0);

  if (items.length === 0) {
    return (
      <Section spacing="default">
        <Container size="form">
          <Stack gap={8}>
            <Stack gap={2}>
              <span className="text-eyebrow">Checkout</span>
              <h1 className="text-title">Almost done.</h1>
            </Stack>
            <Card variant="surface" padding="none" className="overflow-hidden">
              <EmptyState
                icon={ShoppingBag}
                title="Cart is empty"
                description="Add a book from the store before checking out."
                action={
                  <Button asChild size="sm">
                    <Link href="/store">Browse the store</Link>
                  </Button>
                }
              />
            </Card>
          </Stack>
        </Container>
      </Section>
    );
  }

  const razorpayKeyId = getPublicRazorpayKeyId();

  // Pre-fill from the address the customer saved last time (#93).
  const { data: profile } = await supabase
    .from("users")
    .select("default_shipping_address")
    .eq("id", user.id)
    .maybeSingle();
  const savedAddress =
    (profile?.default_shipping_address as Record<string, string> | null) ?? null;

  return (
    <Section spacing="default">
      <Container size="form">
        <Stack gap={6}>
          <Stack gap={2}>
            <span className="text-eyebrow">Checkout</span>
            <h1 className="text-title">Almost done.</h1>
            <p className="text-body text-muted-foreground">
              {totalUnits === 1 ? "1 item" : `${totalUnits} items`} ready to ship.
              Shipping + GST are added at the final step.
            </p>
          </Stack>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="p-4 sm:p-5">
                  <Row gap={4} align="start">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={`/book-covers/${item.book.slug}.webp`}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <Stack gap={1} className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 leading-snug">
                        {item.book.title}
                      </p>
                      <p className="text-caption">
                        {item.quantity} × {formatINR(item.book.price_paise)}
                      </p>
                    </Stack>
                    <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {formatINR(item.book.price_paise * item.quantity)}
                    </span>
                  </Row>
                </li>
              ))}
            </ul>
          </Card>

          {!paymentsLive ? (
            <Card variant="surface" padding="lg">
              <Stack gap={2}>
                <p className="text-headline">Payments open soon 🚀</p>
                <p className="text-body text-muted-foreground">
                  We&apos;re just finishing our secure-payments setup. Your cart is
                  saved — you&apos;ll be able to check out here very shortly. Thanks
                  for being early!
                </p>
                <Row gap={2} className="pt-2 flex-wrap">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/store">Keep browsing</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/contact">Questions? Contact us</Link>
                  </Button>
                </Row>
              </Stack>
            </Card>
          ) : razorpayKeyId ? (
            <CheckoutForm
              subtotalPaise={subtotalPaise}
              razorpayKeyId={razorpayKeyId}
              userEmail={user.email ?? ""}
              userName={(user.user_metadata?.full_name as string) ?? ""}
              savedAddress={savedAddress}
            />
          ) : (
            <Card variant="surface" padding="lg">
              <Stack gap={2}>
                <p className="text-headline">Payment not configured</p>
                <p className="text-body text-muted-foreground">
                  Razorpay keys aren&apos;t set on the server yet. Follow
                  SETUP-PHASE-3.md to paste them into <code>.env.local</code>.
                </p>
              </Stack>
            </Card>
          )}

          <p className="text-caption">
            By placing this order you agree to the{" "}
            <Link href="/legal/terms" className="underline">terms</Link>
            {" "}and the{" "}
            <Link href="/legal/returns" className="underline">no-returns policy</Link>.
          </p>
        </Stack>
      </Container>
    </Section>
  );
}
