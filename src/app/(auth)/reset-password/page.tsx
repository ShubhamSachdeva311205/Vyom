import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";
import { Mascot } from "@/components/ui/mascot";
import { createClient } from "@/lib/supabase/server";
import { Stack } from "@/components/layouts/stack";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // The recovery link goes through /auth/callback which exchanges the
  // code for a session, then redirects here. If there's no session, the
  // link was invalid or expired.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <Stack gap={8}>
      <Stack gap={3} align="center">
        <Mascot name="wisp" size="sm" hideCoupon />
        <Stack gap={1} align="center">
          <h1 className="text-title text-center">Set a new password.</h1>
          <p className="text-caption text-center max-w-[30ch]">
            Choose a new password for your account.
          </p>
        </Stack>
      </Stack>

      <ResetPasswordForm />

      <p className="text-center text-caption">
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
