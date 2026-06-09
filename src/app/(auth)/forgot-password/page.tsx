import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";
import { Mascot } from "@/components/ui/mascot";
import { Stack } from "@/components/layouts/stack";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Stack gap={8}>
      <Stack gap={3} align="center">
        <Mascot name="wisp" size="sm" hideCoupon />
        <Stack gap={1} align="center">
          <h1 className="text-title text-center">Reset your password.</h1>
          <p className="text-caption text-center max-w-[30ch]">
            Enter your email and we&apos;ll send you a link to set a new
            password.
          </p>
        </Stack>
      </Stack>

      <ForgotPasswordForm />

      <p className="text-center text-caption">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </p>
    </Stack>
  );
}
