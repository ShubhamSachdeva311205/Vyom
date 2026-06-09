"use client";

import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/layouts/stack";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result.success) setSent(true);
      else setError(result.error);
    });
  };

  if (sent) {
    return (
      <Stack gap={3} align="center" className="text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-6" aria-hidden="true" />
        </div>
        <p className="text-body">
          If that email is registered, a reset link is on its way. Check your
          inbox (and spam). The link expires in an hour.
        </p>
        <p className="text-caption text-muted-foreground">
          Didn&apos;t get it after a few minutes? Try again — but only a few
          requests per hour are allowed.
        </p>
      </Stack>
    );
  }

  return (
    <form action={onSubmit}>
      <Stack gap={4}>
        <FormField label="Email" required>
          <Input name="email" type="email" autoComplete="email" required autoFocus />
        </FormField>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </Stack>
    </form>
  );
}
