"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
import { env } from "@/lib/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

  // Throttle to slow the admin-OTP brute-force precursor (#110): an attacker
  // triggers a magic-link to the admin, then grinds verifyOtp. Limit how
  // often link-sends can be requested per IP.
  const rl = await rateLimit("admin-magic-link", { limit: 5, windowSec: 300 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  // #75 — strict provisioning gate. Only issue an admin sign-in link to an
  // email that is BOTH in the admin_emails table AND already a verified
  // auth.users account. This closes the env-var takeover: a stale / typo'd /
  // attacker-controlled address in ADMIN_EMAILS can no longer receive an admin
  // link, because the env list is not consulted here. The vague response is
  // identical whether or not the email qualifies, so it leaks nothing.
  const vague: ActionResult = {
    success: false,
    error:
      "If that email is on the admin allowlist, a sign-in link will arrive shortly. Otherwise, no email is sent.",
  };

  const service = createServiceClient();
  const { data: provisioned, error: gateError } = await service.rpc(
    "admin_email_is_provisioned" as never,
    { p_email: email } as never,
  );
  if (gateError) {
    console.error("[admin-auth] provisioning check failed:", gateError.message);
    return vague;
  }
  if (provisioned !== true) {
    return vague;
  }

  const supabase = await createClient();
  const siteUrl = await resolveSiteUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/admin`,
      // Never auto-create an admin account via magic link (#75). The account
      // must already exist + be verified — admins are provisioned explicitly
      // (seed the auth user + an admin_emails row), never bootstrapped from
      // an env var or a first-time link.
      shouldCreateUser: false,
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
