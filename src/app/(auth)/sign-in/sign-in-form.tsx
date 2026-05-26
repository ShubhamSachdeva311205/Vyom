"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn, signInWithGoogle } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Stack } from "@/components/layouts/stack";

export function SignInForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onEmailSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Stack gap={4}>
      <form action={() => signInWithGoogle().then(() => router.refresh())}>
        <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
          <GoogleIcon className="size-4" />
          Continue with Google
        </Button>
      </form>

      <Divider>or</Divider>

      <form action={onEmailSubmit}>
        <Stack gap={4}>
          <FormField label="Email" required>
            <Input name="email" type="email" autoComplete="email" required />
          </FormField>
          <FormField label="Password" required>
            <Input name="password" type="password" autoComplete="current-password" required />
          </FormField>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
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
