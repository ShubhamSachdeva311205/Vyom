"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signInWithGoogle, signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Stack } from "@/components/layouts/stack";

export function SignUpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const onEmailSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (result.success) {
        setSubmitted(formData.get("email") as string);
      } else {
        setError(result.error);
      }
    });
  };

  if (submitted) {
    return (
      <Stack gap={4} className="text-center">
        <h2 className="text-headline">Check your inbox.</h2>
        <p className="text-caption">
          We sent a confirmation link to <span className="text-mono">{submitted}</span>.
          Click it to finish creating your account.
        </p>
        <p className="text-caption text-muted-foreground">
          Didn&rsquo;t arrive? Check spam, or{" "}
          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
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
    <Stack gap={4}>
      <form
        action={() => signInWithGoogle().then(() => router.refresh())}
      >
        <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
          <GoogleIcon className="size-4" />
          Continue with Google
        </Button>
      </form>

      <Divider>or</Divider>

      <form action={onEmailSubmit}>
        <Stack gap={4}>
          <FormField label="Full name (optional)">
            <Input name="fullName" type="text" autoComplete="name" />
          </FormField>
          <FormField label="Email" required>
            <Input name="email" type="email" autoComplete="email" required />
          </FormField>
          <FormField
            label="Password"
            description="At least 8 characters."
            required
          >
            <Input name="password" type="password" autoComplete="new-password" required />
          </FormField>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-mono-tag text-muted-foreground">{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
