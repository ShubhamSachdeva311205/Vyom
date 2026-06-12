"use client";

import { useState, useTransition } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { requestStockNotification } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Stack, Row } from "@/components/layouts/stack";

export function NotifyMeForm({ bookId }: { bookId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    startTransition(async () => {
      const res = await requestStockNotification({ bookId, email });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setDone(true);
      toast.success("We'll email you when it's back.");
    });
  }

  if (done) {
    return (
      <Card variant="surface" padding="md">
        <Row gap={2} align="center">
          <BellRing className="size-4 text-brand" aria-hidden="true" />
          <p className="text-body">You&rsquo;re on the list — we&rsquo;ll email you when it&rsquo;s back in stock.</p>
        </Row>
      </Card>
    );
  }

  return (
    <Card variant="surface" padding="md">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap={2}>
          <p className="text-body font-medium">Out of stock — get notified</p>
          <Row gap={2} className="flex-col sm:flex-row">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@email.com"
              className="sm:flex-1"
            />
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <BellRing className="size-4" aria-hidden="true" />
              )}
              {pending ? "Saving…" : "Notify me"}
            </Button>
          </Row>
        </Stack>
      </form>
    </Card>
  );
}
