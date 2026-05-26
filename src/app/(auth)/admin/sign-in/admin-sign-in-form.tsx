"use client";

import { useState, useTransition } from "react";
import { sendAdminMagicLink } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/layouts/stack";

export function AdminSignInForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await sendAdminMagicLink(formData);
      const email = formData.get("email") as string;
      if (result.success) {
        setSent(email);
      } else {
        // We still show a generic "if you're on the list, link is sent"
        // for non-allowlist emails — that message comes back as
        // result.error from the action.
        setError(result.error);
      }
    });
  };

  if (sent) {
    return (
      <Stack gap={4} className="text-center">
        <h2 className="text-headline">Check your inbox.</h2>
        <p className="text-caption">
          We sent a sign-in link to <span className="text-mono">{sent}</span>.
          The link expires in one hour.
        </p>
        <p className="text-caption text-muted-foreground">
          Didn&rsquo;t arrive? Check spam, or{" "}
          <button
            type="button"
            onClick={() => {
              setSent(null);
              setError(null);
            }}
            className="font-medium text-foreground hover:underline underline-offset-4"
          >
            try again
          </button>
          .
        </p>
      </Stack>
    );
  }

  return (
    <form action={onSubmit}>
      <Stack gap={4}>
        <FormField label="Email" required>
          <Input name="email" type="email" autoComplete="email" required />
        </FormField>

        {error ? (
          <p className="text-sm text-muted-foreground" role="status">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </Stack>
    </form>
  );
}
