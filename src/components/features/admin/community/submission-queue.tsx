"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { moderateSubmission, type PendingSubmission } from "@/actions/community";
import { MediaGallery } from "@/components/features/community/media-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stack, Row } from "@/components/layouts/stack";

const KIND_LABEL: Record<string, string> = {
  poem: "Poem",
  story: "Story",
  drama: "Drama",
  essay: "Essay",
  other: "Writing",
};

export function SubmissionQueue({ initial }: { initial: PendingSubmission[] }) {
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();
  const [actingIds, setActingIds] = useState<Set<string>>(new Set());

  function act(id: string, decision: "approved" | "rejected") {
    setActingIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const res = await moderateSubmission({ id, decision });
      setActingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success(decision === "approved" ? "Published to the feed." : "Rejected.");
    });
  }

  if (rows.length === 0) {
    return (
      <Card variant="flat" padding="lg">
        <Stack gap={1}>
          <h3 className="text-body font-medium">Nothing waiting</h3>
          <p className="text-sm text-muted-foreground">
            New Creative Corner submissions will appear here for review.
          </p>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap={3}>
      {rows.map((s) => (
        <Card key={s.id} variant="surface" padding="lg">
          <Stack gap={3}>
            <Row gap={2} align="center" justify="between" className="flex-wrap">
              <Row gap={2} align="center">
                <Badge>{KIND_LABEL[s.kind] ?? "Writing"}</Badge>
                <span className="text-body font-medium">{s.title}</span>
              </Row>
              <span className="text-xs text-muted-foreground">
                {new Date(s.createdAt).toLocaleDateString("en-IN")}
              </span>
            </Row>
            <p className="text-sm text-muted-foreground">
              {s.name} · {s.email}
            </p>
            <p className="text-body whitespace-pre-wrap max-h-60 overflow-y-auto">{s.body}</p>
            <MediaGallery media={s.media} />
            <Row gap={2}>
              <Button
                size="sm"
                disabled={actingIds.has(s.id)}
                onClick={() => act(s.id, "approved")}
              >
                <Check className="size-4" aria-hidden="true" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actingIds.has(s.id)}
                onClick={() => act(s.id, "rejected")}
              >
                <X className="size-4" aria-hidden="true" /> Reject
              </Button>
            </Row>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
