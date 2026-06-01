import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminSignInForm } from "./admin-sign-in-form";
import { Mascot } from "@/components/ui/mascot";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { Stack } from "@/components/layouts/stack";

export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If already signed in as admin, send straight to /admin.
  if (data.user && (await isAdminEmail(data.user.email))) {
    redirect("/admin");
  }

  return (
    <Stack gap={8}>
      <Stack gap={3} align="center">
        <Mascot name="teacher" size="sm" hideCoupon />
        <Stack gap={1} align="center">
          <h1 className="text-title text-center">Admin sign-in</h1>
          <p className="text-caption text-center max-w-[30ch]">
            Magic-link only. We&rsquo;ll email you a one-time link if the
            address is on the allowlist.
          </p>
        </Stack>
      </Stack>

      <AdminSignInForm />

      <p className="text-center text-caption">
        Not an admin?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline underline-offset-4"
        >
          Customer sign-in
        </Link>
      </p>
    </Stack>
  );
}
