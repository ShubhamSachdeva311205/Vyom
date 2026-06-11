import { listFeedback } from "@/actions/feedback";
import { FeedbackInbox } from "@/components/features/admin/feedback/feedback-inbox";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Feedback · Admin" };

export default async function AdminFeedbackPage() {
  const feedback = await listFeedback("open");

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={6}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Feedback</span>
            <h1 className="text-title">Feedback inbox</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Notes from customers — general and per-book. Mark resolved when
              handled. Reply by email where one was left.
            </p>
          </Stack>

          {feedback.success ? (
            <FeedbackInbox initial={feedback.data ?? []} />
          ) : (
            <Card variant="flat" padding="lg">
              <p className="text-body text-muted-foreground">{feedback.error}</p>
            </Card>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
