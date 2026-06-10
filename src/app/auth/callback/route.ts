import { NextResponse } from "next/server";
import { mergeAnonymousCartIntoUserCart } from "@/actions/cart";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation callback. Exchanges the `code` query param
 * for a session, sets the auth cookies, merges any anonymous cart into
 * the user's cart, and redirects.
 *
 * Both Google OAuth and email signup confirmations land here:
 *   - Google: code from Supabase's /auth/v1/callback after Google redirect.
 *   - Email signup: Supabase's /auth/v1/verify redirects here with code.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Best-effort cart merge — never block the redirect if it fails.
      // The merge is idempotent (no-op if there's no anon cookie or
      // no anon cart on the server) so a retry on next sign-in would
      // recover anyway.
      await mergeAnonymousCartIntoUserCart().catch(() => undefined);

      // Same-origin only. Reject protocol-relative (`//evil.com`) and
      // backslash (`/\evil.com`) prefixes so `next` can't become a
      // cross-origin open redirect — matching the sign-in form + OAuth
      // guards (#76 / roadmap 8.7).
      const safeNext =
        next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
          ? next
          : "/";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=callback_failed`);
}
