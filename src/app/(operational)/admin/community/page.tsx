import { listSubmissions } from "@/actions/community";
import { listReviews } from "@/actions/reviews";
import { ReviewQueue } from "@/components/features/admin/community/review-queue";
import { SubmissionQueue } from "@/components/features/admin/community/submission-queue";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layouts/container";
import { Section } from "@/components/layouts/section";
import { Stack } from "@/components/layouts/stack";

export const metadata = { title: "Community · Admin" };

export default async function AdminCommunityPage() {
  const [subs, reviews] = await Promise.all([
    listSubmissions("pending"),
    listReviews("pending"),
  ]);

  return (
    <Section spacing="default">
      <Container size="page">
        <Stack gap={8}>
          <Stack gap={1}>
            <span className="text-eyebrow">Admin · Community</span>
            <h1 className="text-title">Moderation</h1>
            <p className="text-body text-muted-foreground max-w-2xl">
              Approve or reject Creative Corner submissions and product reviews.
              Approved items appear publicly; rejected ones are hidden.
            </p>
          </Stack>

          <Stack gap={4}>
            <h2 className="text-eyebrow">
              Creative Corner ({subs.success ? subs.data?.length ?? 0 : "—"})
            </h2>
            {subs.success ? (
              <SubmissionQueue initial={subs.data ?? []} />
            ) : (
              <Card variant="flat" padding="lg">
                <p className="text-body text-muted-foreground">{subs.error}</p>
              </Card>
            )}
          </Stack>

          <Stack gap={4}>
            <h2 className="text-eyebrow">
              Product reviews ({reviews.success ? reviews.data?.length ?? 0 : "—"})
            </h2>
            {reviews.success ? (
              <ReviewQueue initial={reviews.data ?? []} />
            ) : (
              <Card variant="flat" padding="lg">
                <p className="text-body text-muted-foreground">{reviews.error}</p>
              </Card>
            )}
          </Stack>
        </Stack>
      </Container>
    </Section>
  );
}
