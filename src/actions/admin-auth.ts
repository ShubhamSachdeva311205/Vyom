"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

/**
 * Admin magic-link sign-in. Rejects emails not on the ADMIN_EMAILS
 * allowlist BEFORE Supabase sends anything — we don't want to spray
 * sign-in emails to arbitrary addresses.
 */
export async function sendAdminMagicLink(formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const { email } = parsed.data;

  if (!(await isAdminEmail(email))) {
    // Deliberately vague — don't leak which addresses are admin.
    return {
      success: false,
      error:
        "If that email is on the admin allowlist, a sign-in link will arrive shortly. Otherwise, no email is sent.",
    };
  }

  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/admin`,
      // Don't create a new auth.users row for an admin we haven't seen
      // yet — admin should pre-exist (we'll seed Mom's account before
      // production). For dev / first-time setup, allow creation.
      shouldCreateUser: env.NODE_ENV !== "production",
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function resolveSiteUrl(): Promise<string> {
  if (env.NEXT_PUBLIC_SITE_URL && env.NEXT_PUBLIC_SITE_URL.startsWith("http")) {
    return env.NEXT_PUBLIC_SITE_URL;
  }
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
