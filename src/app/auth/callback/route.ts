import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation callback. Exchanges the `code` query param
 * for a session, sets the auth cookies, and redirects.
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
      const safeNext = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=callback_failed`);
}
