"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

/**
 * Global error boundary. Catches any unhandled error in a route segment
 * (App Router will use the closest error.tsx). reset() re-renders the
 * subtree. Sentry wire-up lands in Phase 8.2.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs the full error; client only sees a digest. When Sentry
    // is wired up (Phase 8.2), we'll send to it here.
    console.error("Route error:", error);
  }, [error]);

  return (
    <Section spacing="loose">
      <Container size="reading">
        <Stack gap={8}>
          <Stack gap={3}>
            <span className="text-eyebrow">Something broke</span>
            <h1 className="text-display">Hmm, that didn&rsquo;t load.</h1>
            <p className="text-body-lg text-muted-foreground">
              The issue is on our side, not yours. Try again — if it
              keeps happening, drop us a note via the feedback form.
            </p>
            {error.digest ? (
              <p className="text-mono text-xs text-muted-foreground">
                ref: {error.digest}
              </p>
            ) : null}
          </Stack>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <ErrorState
              title="We couldn't load this just now"
              description="The issue is on our side. Retry below — the team is paged on persistent failures."
              onRetry={reset}
            />
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
