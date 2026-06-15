import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CartLineRow } from "@/components/features/store/cart-line-row";
import { Container } from "@/components/layouts/container";
import { Row, Stack } from "@/components/layouts/stack";
import { Section } from "@/components/layouts/section";
import { getCurrentCart } from "@/lib/cart/queries";
import { formatINR } from "@/lib/format";

export const metadata = {
  title: "Cart",
  description: "Your selected books.",
};

export default async function CartPage() {
  const cart = await getCurrentCart();
  const items = cart?.items ?? [];

  const subtotalPaise = items.reduce(
    (sum, it) => sum + it.book.price_paise * it.quantity,
    0,
  );
  const totalUnits = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <Section spacing="default">
      <Container size="reading">
        <Stack gap={6}>
          <Stack gap={2}>
            <span className="text-eyebrow">Cart</span>
            <h1 className="text-title">Your selection</h1>
            <p className="text-body text-muted-foreground">
              {totalUnits === 0
                ? "Nothing here yet."
                : `${totalUnits} ${totalUnits === 1 ? "item" : "items"} ready to check out.`}
            </p>
          </Stack>

          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Browse the store and add a book to get started. Audio + answer keys come bundled free with the physical book."
              action={
                <Button asChild size="md">
                  <Link href="/store">
                    Browse store
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <Stack gap={4}>
              <Card variant="surface" padding="none" className="overflow-hidden">
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id}>
                      <CartLineRow
                        cartItemId={item.id}
                        bookId={item.book.id}
                        bookTitle={item.book.title}
                        bookSubtitle={item.book.subtitle}
                        bookSlug={item.book.slug}
                        unitPricePaise={item.book.price_paise}
                        quantity={item.quantity}
                      />
                    </li>
                  ))}
                </ul>
              </Card>

              <Card variant="surface" padding="lg">
                <Stack gap={3}>
                  <Row align="center" justify="between">
                    <span className="text-body text-muted-foreground">Subtotal</span>
                    <span className="text-headline">{formatINR(subtotalPaise)}</span>
                  </Row>
                  <p className="text-caption">
                    Shipping + any coupons apply at checkout. Bangalore + small
                    orders ship free; everywhere else uses Shiprocket rates.
                  </p>
                  <Button asChild size="md" className="w-full">
                    <Link href="/checkout">
                      Checkout
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </Stack>
              </Card>

              <p className="text-caption">
                Stock holds aren&apos;t reserved until payment completes.
              </p>
            </Stack>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
