import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Section spacing="default">
      <Container size="form">
        <Stack gap={8}>
          <Stack gap={2}>
            <span className="text-eyebrow">Checkout</span>
            <h1 className="text-title">Almost done.</h1>
            <p className="text-body text-muted-foreground">
              Razorpay-backed checkout wires up in Phase 3.
            </p>
          </Stack>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <EmptyState
              icon={ShoppingBag}
              title="Cart is empty"
              description="Add a book or digital companion from the store first."
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
