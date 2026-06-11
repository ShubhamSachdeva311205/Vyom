"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Stack } from "@/components/layouts/stack";

export function ReviewForm({ bookId }: { bookId: string }) {
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitReview({
        bookId,
        rating,
        name: String(fd.get("name") ?? ""),
        title: String(fd.get("title") ?? "") || undefined,
        body: String(fd.get("body") ?? ""),
      });
      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setSubmitted(true);
      toast.success("Thanks! Your review is pending approval.");
    });
  }

  if (submitted) {
    return (
      <Card variant="surface" padding="md">
        <Stack gap={1}>
          <h4 className="text-body font-medium">Thanks for the review ✨</h4>
          <p className="text-sm text-muted-foreground">
            It&rsquo;ll appear here once a human approves it.
          </p>
        </Stack>
      </Card>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Write a review
      </Button>
    );
  }

  return (
    <Card variant="surface" padding="md">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={4}>
          <h4 className="text-body font-medium">Write a review</h4>

          <FormField label="Your rating" required error={error ?? undefined}>
            <StarRating value={rating} onChange={setRating} size="lg" name="rating" />
          </FormField>

          <FormField label="Your name" required>
            <Input name="name" autoComplete="name" maxLength={120} required />
          </FormField>

          <FormField label="Headline" description="Optional — a short summary.">
            <Input name="title" maxLength={200} />
          </FormField>

          <FormField label="Your review" required>
            <Textarea name="body" rows={4} maxLength={5000} required placeholder="What did you think of this book?" />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {pending ? "Submitting…" : "Submit review"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
}
