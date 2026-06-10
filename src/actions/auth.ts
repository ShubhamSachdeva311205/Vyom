"use server";

/**
 * Auth Server Actions. Discriminated-union return shape per CLAUDE.md §4.
 * Email signup runs through the disposable-domain blocklist before
 * Supabase Auth ever sees it.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { mergeAnonymousCartIntoUserCart } from "@/actions/cart";
import { isDisposableEmail } from "@/lib/auth/disposable";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
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

  const rl = await rateLimit("signup", { limit: 5, windowSec: 60 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  if (isDisposableEmail(email)) {
    return { success: false, error: "Nice try, smarty pants." };
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

  const rl = await rateLimit("signin", { limit: 8, windowSec: 60 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Collapse all auth errors to one generic string so the response can't
    // be used as an account-enumeration oracle ("Email not confirmed" vs
    // "Invalid login credentials"). Log the real reason server-side (#113).
    console.error("[auth] sign-in failed:", error.message);
    return { success: false, error: "Invalid email or password." };
  }

  // Best-effort cart merge — never block sign-in success on it.
  await mergeAnonymousCartIntoUserCart().catch(() => undefined);

  return { success: true };
}

/* -----------------------------------------------------------------
 * Sign in with Google — kicks off OAuth, redirects user to Google.
 * The callback at /auth/callback exchanges the returned code and
 * forwards to the `next` param.
 * ----------------------------------------------------------------- */
export async function signInWithGoogle(next?: string): Promise<void> {
  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  // Same open-redirect guard as the client SignInForm.
  const safeNext =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
      ? next
      : "/";
  const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
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
 * Verify OTP — alternative to clicking the magic link / confirmation
 * link. The 6-digit code appears in Mailpit (dev) and the real inbox
 * (prod) alongside the link. Useful when the link gets eaten by
 * email-client safety wrappers.
 *
 * `type` maps to Supabase's verifyOtp types:
 *   - 'signup' → email signup confirmation
 *   - 'email'  → magic-link / OTP login (customer + admin)
 * ----------------------------------------------------------------- */
const otpSchema = z.object({
  email: emailSchema,
  token: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  type: z.enum(["signup", "email", "recovery"]),
});

export async function verifyOtp(formData: FormData): Promise<ActionResult> {
  const parsed = otpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Tight limit — this is the OTP brute-force surface (10^6 space, 1h window).
  // Keyed per email+IP so an attacker can't grind one address from one host.
  const rl = await rateLimit(`otp:${parsed.data.email.toLowerCase()}`, {
    limit: 6,
    windowSec: 300,
  });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: parsed.data.type,
  });

  if (error) {
    console.error("[auth] OTP verify failed:", error.message);
    return { success: false, error: "That code is invalid or has expired." };
  }

  return { success: true };
}

/* -----------------------------------------------------------------
 * Forgot password — send a reset link.
 *
 * Always returns success regardless of whether the email is registered
 * (no account enumeration). Supabase rate-limits these emails server-
 * side. The link lands on /reset-password with a recovery session.
 * ----------------------------------------------------------------- */
export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(formData.get("email")?.toString() ?? "");
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  // Throttle to curb reset-email bombing of a victim address.
  const rl = await rateLimit("reset", { limit: 4, windowSec: 300 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();
  // Best-effort — we ignore the result so we never reveal whether the
  // address exists.
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });
  return { success: true };
}

/* -----------------------------------------------------------------
 * Reset password — set a new password using the recovery session that
 * the email link established.
 * ----------------------------------------------------------------- */
export async function updatePassword(
  formData: FormData,
): Promise<ActionResult> {
  const password = formData.get("password")?.toString() ?? "";
  const confirm = formData.get("confirm")?.toString() ?? "";
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }
  if (password !== confirm) {
    return { success: false, error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "Your reset link has expired. Request a new one from Forgot password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
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
