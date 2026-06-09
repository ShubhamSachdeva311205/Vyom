"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/layouts/stack";

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.success) {
        setDone(true);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      } else {
        setError(result.error);
      }
    });
  };

  if (done) {
    return (
      <p className="text-body text-center text-success">
        Password updated — signing you in…
      </p>
    );
  }

  return (
    <form action={onSubmit}>
      <Stack gap={4}>
        <FormField label="New password" description="At least 8 characters." required>
          <Input name="password" type="password" autoComplete="new-password" required autoFocus />
        </FormField>
        <FormField label="Confirm new password" required>
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </FormField>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Set new password"}
        </Button>
      </Stack>
    </form>
  );
}
