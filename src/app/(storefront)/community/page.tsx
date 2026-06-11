import { SubmissionCard } from "@/components/features/community/submission-card";
import { SubmissionForm } from "@/components/features/community/submission-form";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";
import { getApprovedSubmissions } from "@/lib/queries/community";

export const metadata = {
  title: "Community",
  description: "Student writing and feedback for Advaita.",
};

export default async function CommunityPage() {
  const posts = await getApprovedSubmissions();

  return (
    <Section spacing="default">
      <Container>
        <Stack gap={10}>
          <Stack gap={3}>
            <span className="text-eyebrow">Community</span>
            <h1 className="text-display">Share. Read. Reply.</h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl">
              The Creative Corner is for student poems, stories, and dramas.
              Submit your own — no account required — and read what others have
              shared. Every piece is reviewed by a human before it appears.
            </p>
          </Stack>

          <SubmissionForm />

          <Stack gap={4}>
            <Row gap={3} align="center" justify="between">
              <h2 className="text-title">From the Creative Corner</h2>
            </Row>

            {posts.length === 0 ? (
              <Card variant="flat" padding="lg">
                <Row gap={4} align="center" justify="between" className="flex-wrap">
                  <Stack gap={1}>
                    <h3 className="text-title">Nothing published yet</h3>
                    <p className="text-body text-muted-foreground max-w-md">
                      The feed is waiting for its first piece. Share a poem, a
                      story, or a short drama above — once it&rsquo;s approved
                      it&rsquo;ll appear right here.
                    </p>
                  </Stack>
                  <Mascot name="wisp" size="md" hideCoupon />
                </Row>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <SubmissionCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
}
