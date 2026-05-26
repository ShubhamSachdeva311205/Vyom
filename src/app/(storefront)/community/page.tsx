import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";

export const metadata = {
  title: "Community",
  description: "Student writing and feedback for Advaita.",
};

export default function CommunityPage() {
  return (
    <Section spacing="default">
      <Container>
        <Stack gap={10}>
          <Stack gap={3}>
            <span className="text-eyebrow">Community</span>
            <h1 className="text-display">Share. Read. Reply.</h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl">
              Two front doors: the Creative Corner for student poems,
              stories, and dramas, and a public Feedback line that goes
              straight to us. Both accept guest submissions — no account
              required.
            </p>
          </Stack>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="surface" padding="lg">
              <CardHeader>
                <Row gap={3} align="center" justify="between">
                  <Stack gap={1}>
                    <span className="text-eyebrow">Coming soon</span>
                    <CardTitle>Creative Corner</CardTitle>
                  </Stack>
                  <Mascot name="wisp" size="sm" hideCoupon />
                </Row>
                <CardDescription>
                  Submit poems, short stories, and dramas. Approved
                  submissions appear in the public feed. Moderated by the
                  Advaita team within 48 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" disabled>
                  Submission form coming soon
                </Button>
              </CardContent>
            </Card>

            <Card variant="surface" padding="lg">
              <CardHeader>
                <Row gap={3} align="center" justify="between">
                  <Stack gap={1}>
                    <span className="text-eyebrow">Coming soon</span>
                    <CardTitle>Feedback</CardTitle>
                  </Stack>
                  <Mascot name="teacher" size="sm" hideCoupon />
                </Row>
                <CardDescription>
                  Tell us what&rsquo;s missing, what worked, what didn&rsquo;t.
                  Goes straight to the admin dashboard. Anonymous welcome.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" disabled>
                  Feedback form coming soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card variant="flat" padding="md">
            <Row gap={3} align="center" justify="between" className="flex-wrap">
              <Stack gap={1}>
                <span className="text-eyebrow">Curious about catalog</span>
                <p className="text-body">Want to know when the store opens?</p>
              </Stack>
              <Button asChild size="sm" variant="outline">
                <Link href="/store">Visit the store</Link>
              </Button>
            </Row>
          </Card>
        </Stack>
      </Container>
    </Section>
  );
}
