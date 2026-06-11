"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/actions/feedback";
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
import {
  FEEDBACK_KINDS,
  FEEDBACK_KIND_LABELS,
  type FeedbackKind,
} from "@/lib/feedback/constants";

interface FeedbackFormProps {
  /** When set, the form offers an "about this book" vs "general" toggle (PDP). */
  bookId?: string;
  title?: string;
  description?: string;
}

export function FeedbackForm({
  bookId,
  title = "Send feedback",
  description = "Tell us what worked, what didn't, or what you'd like to see. Goes straight to us — not public.",
}: FeedbackFormProps) {
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<FeedbackKind>(bookId ? "content_request" : "other");
  // On a product page, let the customer choose whether this note is about
  // the book or general. Off the product page there's no book to tag.
  const [scope, setScope] = useState<"product" | "general">(
    bookId ? "product" : "general",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitFeedback({
        kind,
        body: String(fd.get("body") ?? ""),
        name: String(fd.get("name") ?? "") || undefined,
        email: String(fd.get("email") ?? "") || undefined,
        bookId: scope === "product" ? bookId : undefined,
      });
      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setSubmitted(true);
      toast.success("Thanks — your feedback reached us.");
    });
  }

  if (submitted) {
    return (
      <Card variant="surface" padding="lg">
        <Stack gap={1}>
          <h3 className="text-title">Thank you 🙏</h3>
          <p className="text-body text-muted-foreground">
            We read every note. If you left an email, we may follow up.
          </p>
        </Stack>
      </Card>
    );
  }

  return (
    <Card variant="surface" padding="lg">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={4}>
          <Stack gap={1}>
            <span className="text-eyebrow">Feedback</span>
            <h3 className="text-title">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </Stack>

          {bookId && (
            <FormField label="What's this about?" required>
              <div
                role="radiogroup"
                aria-label="Feedback scope"
                className="inline-flex rounded-md border border-border p-0.5"
              >
                {(
                  [
                    ["product", "This book"],
                    ["general", "General"],
                  ] as const
                ).map(([value, label]) => {
                  const active = scope === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setScope(value)}
                      className={
                        "min-h-[40px] rounded-[5px] px-4 text-sm transition-colors " +
                        (active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </FormField>
          )}

          <FormField label="Topic" required className="sm:w-64">
            <Select value={kind} onValueChange={(v) => setKind(v as FeedbackKind)}>
              <SelectTrigger aria-label="Feedback topic">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_KINDS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {FEEDBACK_KIND_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Your message" required error={error ?? undefined}>
            <Textarea name="body" rows={4} maxLength={5000} required placeholder="What's on your mind?" />
          </FormField>

          <Row gap={3} className="flex-col sm:flex-row">
            <FormField label="Name" description="Optional" className="flex-1">
              <Input name="name" autoComplete="name" maxLength={120} />
            </FormField>
            <FormField label="Email" description="Optional — for a reply" className="flex-1">
              <Input name="email" type="email" autoComplete="email" />
            </FormField>
          </Row>

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              {pending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </Stack>
      </form>
    </Card>
  );
}
