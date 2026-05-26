"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Browser Supabase client. Use inside "use client" components and
 * hooks. Auth state is kept in cookies (managed by @supabase/ssr) so
 * server reads pick up the same session.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
