"use client";

import { useState, useTransition } from "react";
import { Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { submitCommunityPost } from "@/actions/community";
import { MediaUploader } from "@/components/features/community/media-uploader";
import {
  SUBMISSION_KINDS,
  type MediaItem,
  type SubmissionKind,
} from "@/lib/community/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Stack, Row } from "@/components/layouts/stack";

const KIND_LABELS: Record<SubmissionKind, string> = {
  poem: "Poem",
  story: "Short story",
  drama: "Drama / play",
  essay: "Essay",
  other: "Something else",
};

export function SubmissionForm({
  onSuccess,
  bare = false,
}: { onSuccess?: () => void; bare?: boolean } = {}) {
  // `bare` drops the outer card + header (used inside the FAB dialog, which
  // already provides chrome + a title).
  const wrap = (children: React.ReactNode) =>
    bare ? <>{children}</> : (
      <Card variant="surface" padding="lg">
        {children}
      </Card>
    );
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<SubmissionKind>("poem");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      kind,
      title: String(fd.get("title") ?? ""),
      body: String(fd.get("body") ?? ""),
      media,
    };
    startTransition(async () => {
      const res = await submitCommunityPost(payload);
      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setSubmitted(true);
      toast.success("Thanks! Your piece is in the moderation queue.");
      onSuccess?.();
    });
  }

  if (submitted) {
    return wrap(
      <Stack gap={2}>
        <span className="text-eyebrow">Submitted</span>
        <h3 className="text-title">Thank you for sharing ✨</h3>
        <p className="text-body text-muted-foreground">
          Your piece is in the moderation queue. Approved work appears in the
          Creative Corner feed, usually within 48 hours.
        </p>
        <div>
          <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
            Submit another
          </Button>
        </div>
      </Stack>,
    );
  }

  return wrap(
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        {!bare && (
          <Stack gap={1}>
            <span className="text-eyebrow">Creative Corner</span>
            <h3 className="text-title">Share your writing</h3>
            <p className="text-sm text-muted-foreground">
              Poems, stories, dramas — guest submissions welcome. A human reviews
              every piece before it goes live.
            </p>
          </Stack>
        )}

          <Row gap={3} className="flex-col sm:flex-row">
            <FormField label="Your name" required className="flex-1">
              <Input name="name" autoComplete="name" maxLength={120} required />
            </FormField>
            <FormField
              label="Email"
              required
              description="Private — only so we can reach you."
              className="flex-1"
            >
              <Input name="email" type="email" autoComplete="email" required />
            </FormField>
          </Row>

          <Row gap={3} className="flex-col sm:flex-row">
            <FormField label="Type" required className="sm:w-48">
              <Select value={kind} onValueChange={(v) => setKind(v as SubmissionKind)}>
                <SelectTrigger aria-label="Type of writing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Title" required className="flex-1">
              <Input name="title" maxLength={200} required />
            </FormField>
          </Row>

          <FormField label="Your piece" required error={error ?? undefined}>
            <Textarea name="body" rows={8} maxLength={20000} required placeholder="Write or paste your poem, story, or drama here…" />
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Photos / videos</span>
            <MediaUploader value={media} onChange={setMedia} disabled={pending} />
          </div>

          <Row gap={3} align="center" justify="between" className="flex-wrap">
            <p className="text-xs text-muted-foreground">
              By submitting you agree it can be shown publicly in the Creative Corner.
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <PenLine className="size-4" aria-hidden="true" />
              )}
              {pending ? "Submitting…" : "Submit for review"}
            </Button>
          </Row>
        </Stack>
      </form>,
  );
}
