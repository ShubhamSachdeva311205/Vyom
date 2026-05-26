import { env } from "@/lib/env";

/**
 * Admin allowlist — hardcoded list of emails permitted to reach
 * /admin/*. Set via ADMIN_EMAILS env var, comma-separated, no spaces.
 *
 *   ADMIN_EMAILS=shubhamhelpseries@gmail.com,mom@example.com
 *
 * Used by middleware to gate /admin/* routes AND by the admin sign-in
 * Server Action to reject magic-link requests from non-admin emails
 * before Supabase ever sends them.
 */

let cached: Set<string> | null = null;

function getAllowlist(): Set<string> {
  if (cached) return cached;
  const raw = env.ADMIN_EMAILS ?? "";
  cached = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return cached;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowlist().has(email.trim().toLowerCase());
}
