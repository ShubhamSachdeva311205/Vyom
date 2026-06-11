import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Stack, Row } from "@/components/layouts/stack";
import type { ApprovedSubmission } from "@/lib/queries/community";

const KIND_LABEL: Record<string, string> = {
  poem: "Poem",
  story: "Story",
  drama: "Drama",
  essay: "Essay",
  other: "Writing",
};

export function SubmissionCard({ post }: { post: ApprovedSubmission }) {
  return (
    <Card variant="surface" padding="lg">
      <Stack gap={3}>
        <Row gap={2} align="center" justify="between">
          <Badge>{KIND_LABEL[post.kind] ?? "Writing"}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </Row>
        <Stack gap={1}>
          <h3 className="text-title">{post.title}</h3>
          <p className="text-sm text-muted-foreground">by {post.name}</p>
        </Stack>
        <p className="text-body whitespace-pre-wrap">{post.body}</p>
      </Stack>
    </Card>
  );
}
