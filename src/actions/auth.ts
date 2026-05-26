"use server";

/**
 * Auth Server Actions. Discriminated-union return shape per CLAUDE.md §4.
 * Email signup runs through the disposable-domain blocklist before
 * Supabase Auth ever sees it.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isDisposableEmail } from "@/lib/auth/disposable";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().max(120).optional(),
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/* -----------------------------------------------------------------
 * Sign up — email + password. Sends a confirmation email; user must
 * verify before the session becomes valid (Supabase enforces this
 * because we set [auth.email] enable_confirmations = true).
 * ----------------------------------------------------------------- */
export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, fullName } = parsed.data;

  if (isDisposableEmail(email)) {
    return {
      success: false,
      error:
        "Nice try, smarty pants — we can spot a throwaway email a mile off 😎 Use your real address so we can actually send you your books.",
    };
  }

  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/* -----------------------------------------------------------------
 * Sign in — email + password
 * ----------------------------------------------------------------- */
export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/* -----------------------------------------------------------------
 * Sign in with Google — kicks off OAuth, redirects user to Google.
 * The callback at /auth/callback exchanges the returned code.
 * ----------------------------------------------------------------- */
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    redirect(`/auth/error?reason=oauth_init_failed`);
  }

  redirect(data.url);
}

/* -----------------------------------------------------------------
 * Sign out
 * ----------------------------------------------------------------- */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/* -----------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------- */
async function resolveSiteUrl(): Promise<string> {
  if (env.NEXT_PUBLIC_SITE_URL && env.NEXT_PUBLIC_SITE_URL.startsWith("http")) {
    return env.NEXT_PUBLIC_SITE_URL;
  }
  // Fall back to the incoming request's origin (handles preview deploys).
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
