import "server-only";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Admin allowlist resolver.
 *
 * Two sources of truth, unioned:
 *
 *   1. **Env var** (`ADMIN_EMAILS`, comma-separated) — bootstrap. Lets
 *      the first admin sign in before any DB row exists, and acts as a
 *      backstop if the DB is unreachable.
 *   2. **`public.admin_emails` table** — runtime, CRUD-able via
 *      /admin/settings UI (Phase 5.5). This is what Mom actually edits.
 *
 * The Postgres `is_admin()` helper already reads from the table, so RLS
 * + SECURITY DEFINER RPCs are consistent. This TS-side function brings
 * the middleware + Server Actions in line.
 *
 * Async — every caller awaits. Compared to the old sync env-only check
 * we cost one DB roundtrip per `/admin/*` request, which is fine for
 * admin traffic volumes.
 */

let cachedEnvSet: Set<string> | null = null;

function getEnvAllowlist(): Set<string> {
  if (cachedEnvSet) return cachedEnvSet;
  const raw = env.ADMIN_EMAILS ?? "";
  cachedEnvSet = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return cachedEnvSet;
}

export async function isAdminEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  if (!normalised) return false;

  // Env wins — short-circuit before the DB hit.
  if (getEnvAllowlist().has(normalised)) return true;

  try {
    const supabase = createServiceClient();
    // Exact, case-insensitive match. `normalised` is already lowercased and
    // stored emails are always lowercase (see addAdminEmail / the seed), so
    // `.eq` is correct. Never use `.ilike` here: `_` and `%` are legal email
    // characters that ILIKE treats as wildcards, letting e.g. `supervis_r@x`
    // match a stored `supervisor@x`.
    const { data } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", normalised)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}
