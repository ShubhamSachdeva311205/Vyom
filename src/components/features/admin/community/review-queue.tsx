"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { moderateReview, type AdminReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Stack, Row } from "@/components/layouts/stack";

export function ReviewQueue({ initial }: { initial: AdminReview[] }) {
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();
  const [actingIds, setActingIds] = useState<Set<string>>(new Set());

  function act(id: string, decision: "approved" | "rejected") {
    setActingIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const res = await moderateReview({ id, decision });
      setActingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success(decision === "approved" ? "Published." : "Rejected.");
    });
  }

  if (rows.length === 0) {
    return (
      <Card variant="flat" padding="lg">
        <Stack gap={1}>
          <h3 className="text-body font-medium">No reviews waiting</h3>
          <p className="text-sm text-muted-foreground">
            New product reviews will appear here for approval.
          </p>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap={3}>
      {rows.map((r) => (
        <Card key={r.id} variant="surface" padding="lg">
          <Stack gap={3}>
            <Row gap={2} align="center" justify="between" className="flex-wrap">
              <Row gap={2} align="center">
                <StarRating value={r.rating} readOnly size="sm" />
                <span className="text-sm text-muted-foreground">on {r.bookTitle}</span>
              </Row>
              <span className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </span>
            </Row>
            {r.title && <p className="text-body font-medium">{r.title}</p>}
            <p className="text-body whitespace-pre-wrap">{r.body}</p>
            <p className="text-sm text-muted-foreground">— {r.name}</p>
            <Row gap={2}>
              <Button
                size="sm"
                disabled={actingIds.has(r.id)}
                onClick={() => act(r.id, "approved")}
              >
                <Check className="size-4" aria-hidden="true" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actingIds.has(r.id)}
                onClick={() => act(r.id, "rejected")}
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
