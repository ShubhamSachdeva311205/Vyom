import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { MascotName } from "@/components/ui/mascot";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";
import type { ReactNode } from "react";

/**
 * ShellPage — placeholder layout for Phase 1.3 route shells. Renders a
 * hero (eyebrow + title + description) and an EmptyState with a mascot
 * so the route never feels like a 404. Real content lands in Phase 2+.
 */

interface ShellPageProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Empty state title. */
  emptyTitle: string;
  /** Empty state description. */
  emptyDescription: string;
  mascot?: MascotName;
  action?: ReactNode;
}

export function ShellPage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  mascot = "bookworm",
  action,
}: ShellPageProps) {
  return (
    <Section spacing="default">
      <Container>
        <Stack gap={10}>
          <Stack gap={3}>
            <span className="text-eyebrow">{eyebrow}</span>
            <h1 className="text-display">{title}</h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl">
              {description}
            </p>
          </Stack>

          <Card variant="surface" padding="none" className="overflow-hidden">
            <EmptyState
              mascot={mascot}
              title={emptyTitle}
              description={emptyDescription}
              action={action}
            />
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
