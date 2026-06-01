import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Route protection + Supabase session refresh on every request.
 *
 *   Anyone:        /, /store, /ibdp, /igcse, /community, /legal/*, /sign-in,
 *                  /sign-up, /admin/sign-in, /auth/*, /design-tokens, static
 *   Signed-in:     /dashboard/*, /checkout
 *   Admin only:    /admin/* (except /admin/sign-in)
 *
 * Run on every request (see matcher at the bottom) so the session JWT
 * stays fresh — without this, expired tokens linger and Server
 * Components see a stale user.
 */
export async function middleware(request: NextRequest) {
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

  // Refresh + revalidate the JWT against the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/sign-in";
  const isCustomerProtected =
    pathname.startsWith("/dashboard") || pathname === "/checkout";

  // Admin routes — require auth + allowlist.
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!(await isAdminEmail(user.email))) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("auth_error", "not_admin");
      return NextResponse.redirect(url);
    }
  }

  // Customer-protected routes — any signed-in user.
  if (isCustomerProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every path EXCEPT:
     *   - _next/static and _next/image (Next internals)
     *   - favicon.ico, robots.txt, sitemap.xml (static metadata)
     *   - file extensions (images, css, etc.)
     * The auth cookie refresh needs to run on real navigations and
     * Server Action posts; static assets don't need it.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
