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
 * Fast-path: if the visitor has no Supabase auth cookie (`sb-*`) and is
 * requesting a public route, skip the remote `auth.getUser()` roundtrip.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/sign-in";
  const isCustomerProtected =
    pathname.startsWith("/dashboard") || pathname === "/checkout";

  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!hasAuthCookie && !isAdminRoute && !isCustomerProtected) {
    return NextResponse.next({ request });
  }

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

  // Refresh + revalidate the JWT against the auth server only when a session cookie exists
  const {
    data: { user },
  } = hasAuthCookie ? await supabase.auth.getUser() : { data: { user: null } };

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
