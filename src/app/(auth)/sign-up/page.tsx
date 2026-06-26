import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";
import { Mascot } from "@/components/ui/mascot";
import { createClient } from "@/lib/supabase/server";
import { Stack } from "@/components/layouts/stack";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Vyom account to access digital books and place orders.",
};

export default async function SignUpPage() {
  // Already signed in? Go home.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <Stack gap={8}>
      <Stack gap={3} align="center">
        <Mascot name="bookworm" size="sm" hideCoupon />
        <Stack gap={1} align="center">
          <h1 className="text-title text-center">Create your account</h1>
          <p className="text-caption text-center max-w-[28ch]">
            Used for order history, digital access, and receipts.
          </p>
        </Stack>
      </Stack>

      <SignUpForm />

      <p className="text-center text-caption">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </Stack>
  );
}
