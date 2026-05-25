import { Library } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

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

          <Card variant="surface" padding="none" className="overflow-hidden">
            <EmptyState
              icon={Library}
              title="No purchases yet"
              description="Once you buy a book or digital companion, it'll appear here."
            />
          </Card>

          <Card variant="surface" padding="lg">
            <CardHeader>
              <CardTitle>Access from Amazon?</CardTitle>
              <CardDescription>
                Email <span className="text-mono">team@advaita.in</span>{" "}
                with your Amazon order ID and the team will grant your
                digital access manually within 24 hours.
              </CardDescription>
            </CardHeader>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
