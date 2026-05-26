"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyOtp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { Stack } from "@/components/layouts/stack";

/**
 * Inline OTP verification form. Renders inside the "check your inbox"
 * state on /sign-up, /sign-in, and /admin/sign-in. Same OTP code shown
 * in the email body — gives users a paste-friendly path when the link
 * doesn't open.
 */

interface VerifyOtpFormProps {
  email: string;
  /** Maps to Supabase's verifyOtp `type` field. */
  type: "signup" | "email";
  /** Where to send the user after a successful verify. */
  redirectTo?: string;
}

export function VerifyOtpForm({ email, type, redirectTo = "/" }: VerifyOtpFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      // Server Action wants the email + type in the form too.
      formData.set("email", email);
      formData.set("type", type);
      const result = await verifyOtp(formData);
      if (result.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form action={submit}>
      <Stack gap={3}>
        <p className="text-caption text-center">
          Or paste the 6-digit code from the email:
        </p>
        <OtpInput
          name="token"
          disabled={pending}
          onComplete={() => {
            // Auto-submit when 6 digits entered.
            const form = document.activeElement?.closest("form") as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          ariaLabel="6-digit code from your email"
        />
        {error ? (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="outline" size="md" className="w-full" disabled={pending}>
          {pending ? "Verifying…" : "Verify code"}
        </Button>
      </Stack>
    </form>
  );
}
