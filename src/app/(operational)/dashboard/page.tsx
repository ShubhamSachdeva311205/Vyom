import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack, Row } from "@/components/layouts/stack";

export const metadata = { title: "Your library" };

export default function DashboardPage() {
  return (
    <Section spacing="default">
      <Container>
        <Stack gap={8}>
          <Stack gap={2}>
            <span className="text-eyebrow">Library</span>
            <h1 className="text-title">Your purchases.</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Audio companions stream from this page. PDFs render with
              your email + order ID watermarked inline — they can&rsquo;t
              be saved or copied.
            </p>
          </Stack>

          <Card variant="surface" padding="lg">
            <CardHeader>
              <Row gap={3} align="center" justify="between" className="flex-wrap">
                <Stack gap={1}>
                  <CardTitle>My Library</CardTitle>
                  <CardDescription>
                    Stream audio companions and open watermarked answer keys
                    for the books you own.
                  </CardDescription>
                </Stack>
                <Button asChild>
                  <Link href="/dashboard/library">
                    Open library
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </Row>
            </CardHeader>
          </Card>

          <Card variant="surface" padding="lg">
            <CardHeader>
              <Row gap={3} align="center" justify="between" className="flex-wrap">
                <Stack gap={1}>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>
                    Order history, tax invoices, and shipment tracking.
                  </CardDescription>
                </Stack>
                <Button asChild variant="outline">
                  <Link href="/dashboard/orders">
                    View orders
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </Row>
            </CardHeader>
          </Card>

          <Card variant="surface" padding="lg">
            <CardHeader>
              <Row gap={3} align="center" justify="between" className="flex-wrap">
                <Stack gap={1}>
                  <CardTitle>Account settings</CardTitle>
                  <CardDescription>
                    Update your name, email, or password.
                  </CardDescription>
                </Stack>
                <Button asChild variant="outline">
                  <Link href="/dashboard/settings">
                    Manage
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </Row>
            </CardHeader>
          </Card>

          <Card variant="surface" padding="lg">
            <CardHeader>
              <CardTitle>Access from Amazon?</CardTitle>
              <CardDescription>
                Email{" "}
                <span className="text-mono">shubhamhelpseries@gmail.com</span>{" "}
                with your Amazon order ID and we&rsquo;ll grant your digital
                access manually within 24 hours.
              </CardDescription>
            </CardHeader>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
