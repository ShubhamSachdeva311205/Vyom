import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Server Supabase client. Use inside Server Components, Server Actions,
 * Route Handlers, and middleware. Reads + writes auth cookies via the
 * Next.js `cookies()` API so the session stays consistent across the
 * RSC boundary.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from Server Components, which can't set
            // cookies. That's fine if a middleware is refreshing the
            // session (Phase 2.5) — the cookies update on response.
          }
        },
      },
    },
  );
}

/**
 * Service-role Supabase client. Bypasses RLS — use only in trusted
 * server contexts: webhook handlers, admin Server Actions, etc.
 * NEVER expose to the browser.
 */
export function createServiceClient() {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* no-op */
        },
      },
    },
  );
}
