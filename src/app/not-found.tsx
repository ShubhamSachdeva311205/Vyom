import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <Section spacing="loose">
      <Container size="reading">
        <Stack gap={8}>
          <Stack gap={3}>
            <span className="text-eyebrow">404</span>
            <h1 className="text-display">Page not found.</h1>
            <p className="text-body-lg text-muted-foreground">
              The page you&rsquo;re looking for moved, was renamed, or
              never existed. The bookworm got a little lost too.
            </p>
          </Stack>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <EmptyState
              mascot="bookworm"
              mascotMood="sad"
              title="Nothing at this address"
              description="Head back to the store, the curriculum pages, or the homepage."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/">
                    <ArrowLeft /> Back to home
                  </Link>
                </Button>
              }
            />
          </Card>

          {/* 🥚 Treasure-hunt easter egg (#26) — a working code for the curious. */}
          <details className="group mx-auto w-fit text-center">
            <summary className="cursor-pointer list-none text-2xl opacity-40 transition-opacity hover:opacity-100 [&::-webkit-details-marker]:hidden">
              🥚
            </summary>
            <p className="mt-2 text-caption text-muted-foreground">
              You found it! Use code{" "}
              <span className="font-mono font-medium text-foreground">FOUNDIT10</span>{" "}
              for 10% off your next order. 🤫
            </p>
          </details>
        </Stack>
      </Container>
    </Section>
  );
}
