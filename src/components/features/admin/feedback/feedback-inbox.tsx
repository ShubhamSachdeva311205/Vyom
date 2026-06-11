"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { resolveFeedback, type FeedbackRow } from "@/actions/feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stack, Row } from "@/components/layouts/stack";
import { FEEDBACK_KIND_LABELS, type FeedbackKind } from "@/lib/feedback/constants";

export function FeedbackInbox({ initial }: { initial: FeedbackRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [actingId, setActingId] = useState<string | null>(null);

  function toggle(id: string, resolved: boolean) {
    setActingId(id);
    startTransition(async () => {
      const res = await resolveFeedback({ id, resolved });
      setActingId(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setRows((r) => r.map((x) => (x.id === id ? { ...x, resolved } : x)));
      toast.success(resolved ? "Marked resolved." : "Reopened.");
    });
  }

  if (rows.length === 0) {
    return (
      <Card variant="flat" padding="lg">
        <Stack gap={1}>
          <h3 className="text-body font-medium">Inbox zero ✨</h3>
          <p className="text-sm text-muted-foreground">
            No open feedback right now. New notes from customers land here.
          </p>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap={3}>
      {rows.map((f) => (
        <Card
          key={f.id}
          variant="surface"
          padding="lg"
          className={f.resolved ? "opacity-60" : undefined}
        >
          <Stack gap={2}>
            <Row gap={2} align="center" justify="between" className="flex-wrap">
              <Row gap={2} align="center" className="flex-wrap">
                <Badge>{FEEDBACK_KIND_LABELS[f.kind as FeedbackKind] ?? f.kind}</Badge>
                {f.bookTitle && (
                  <span className="text-xs text-muted-foreground">on {f.bookTitle}</span>
                )}
                {f.resolved && <Badge variant="secondary">Resolved</Badge>}
              </Row>
              <span className="text-xs text-muted-foreground">
                {new Date(f.createdAt).toLocaleDateString("en-IN")}
              </span>
            </Row>
            <p className="text-body whitespace-pre-wrap">{f.body}</p>
            <p className="text-sm text-muted-foreground">
              {f.name || "Anonymous"}
              {f.email ? ` · ${f.email}` : ""}
            </p>
            <Row gap={2}>
              {f.resolved ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending && actingId === f.id}
                  onClick={() => toggle(f.id, false)}
                >
                  <RotateCcw className="size-4" aria-hidden="true" /> Reopen
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={pending && actingId === f.id}
                  onClick={() => toggle(f.id, true)}
                >
                  <Check className="size-4" aria-hidden="true" /> Mark resolved
                </Button>
              )}
              {f.email && (
                <Button asChild size="sm" variant="ghost">
                  <a href={`mailto:${f.email}`}>Reply</a>
                </Button>
              )}
            </Row>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
