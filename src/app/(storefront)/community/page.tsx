import { CommunitySubmitFab } from "@/components/features/community/community-submit-fab";
import { SubmissionCard } from "@/components/features/community/submission-card";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Row, Stack } from "@/components/layouts/stack";
import { getApprovedSubmissions } from "@/lib/queries/community";

export const metadata = {
  title: "Community",
  description: "Student writing from the Vyom Creative Corner.",
};

export default async function CommunityPage() {
  const posts = await getApprovedSubmissions();

  return (
    <Section spacing="default">
      <Container>
        <Stack gap={8}>
          <Stack gap={3}>
            <span className="text-eyebrow">Creative Corner</span>
            <h1 className="text-display">Read. Get inspired.</h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl">
              Student poems, stories, and dramas. Read what others have shared —
              and tap the <span className="font-medium text-foreground">+</span>{" "}
              button to add your own. Every piece is reviewed by a human before it
              appears.
            </p>
          </Stack>

          {posts.length === 0 ? (
            <Card variant="flat" padding="lg">
              <Row gap={4} align="center" justify="between" className="flex-wrap">
                <Stack gap={1}>
                  <h3 className="text-title">Nothing published yet</h3>
                  <p className="text-body text-muted-foreground max-w-md">
                    The feed is waiting for its first piece. Tap the{" "}
                    <span className="font-medium text-foreground">+</span> button
                    to share a poem, a story, or a short drama — once it&rsquo;s
                    approved it&rsquo;ll appear right here.
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
      </Container>

      {/* Floating "+" to open the submission form */}
      <CommunitySubmitFab />
    </Section>
  );
}
