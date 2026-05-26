import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Refresh the Supabase auth session on every request. Called from the
 * project-root `middleware.ts` (added in Phase 2.5). The response that
 * leaves this function carries any updated auth cookies.
 *
 * Route protection (redirect-if-unauthenticated for /admin/*, /dashboard/*,
 * /checkout) is layered on top of this in Phase 2.5.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() refreshes the session and revalidates the JWT
  // against the auth server. Do this on EVERY request — never trust the
  // cookie-stored user without it.
  await supabase.auth.getUser();

  return response;
}
