import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Stack, Row } from "@/components/layouts/stack";
import { ReviewForm } from "./review-form";
import type { BookReviewSummary } from "@/lib/queries/reviews";

interface ProductReviewsProps {
  bookId: string;
  summary: BookReviewSummary;
}

export function ProductReviews({ bookId, summary }: ProductReviewsProps) {
  const { reviews, avg, count } = summary;

  return (
    <Stack gap={6} aria-labelledby="reviews-heading">
      <Row gap={4} align="center" justify="between" className="flex-wrap">
        <Stack gap={1}>
          <h2 id="reviews-heading" className="text-title">
            Reviews
          </h2>
          {count > 0 ? (
            <Row gap={2} align="center">
              <StarRating value={avg} readOnly size="sm" />
              <span className="text-body font-medium">{avg.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({count} review{count === 1 ? "" : "s"})
              </span>
            </Row>
          ) : (
            <p className="text-sm text-muted-foreground">
              No reviews yet — be the first to share what you thought.
            </p>
          )}
        </Stack>
        <ReviewForm bookId={bookId} />
      </Row>

      {reviews.length > 0 && (
        <Stack gap={3}>
          {reviews.map((r) => (
            <Card key={r.id} variant="surface" padding="md">
              <Stack gap={2}>
                <Row gap={2} align="center" justify="between">
                  <StarRating value={r.rating} readOnly size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Row>
                {r.title && <p className="text-body font-medium">{r.title}</p>}
                <p className="text-body whitespace-pre-wrap">{r.body}</p>
                <p className="text-sm text-muted-foreground">— {r.name}</p>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
