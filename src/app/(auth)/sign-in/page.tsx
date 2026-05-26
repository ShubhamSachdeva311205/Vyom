import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";
import { Mascot } from "@/components/ui/mascot";
import { createClient } from "@/lib/supabase/server";
import { Stack } from "@/components/layouts/stack";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Advaita account.",
};

export default async function SignInPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <Stack gap={8}>
      <Stack gap={3} align="center">
        <Mascot name="wisp" size="sm" hideCoupon />
        <Stack gap={1} align="center">
          <h1 className="text-title text-center">Welcome back.</h1>
          <p className="text-caption text-center max-w-[28ch]">
            Sign in to access your library or place an order.
          </p>
        </Stack>
      </Stack>

      <SignInForm />

      <p className="text-center text-caption">
        New to Advaita?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </Stack>
  );
}
