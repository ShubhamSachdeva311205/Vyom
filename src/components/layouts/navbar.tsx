import Link from "next/link";
import { ShoppingCart, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin";
import { getCurrentCartItemCount } from "@/lib/cart/queries";
import { createClient, hasSupabaseAuthCookie } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { UserMenu } from "@/components/ui/user-menu";
import { MobileNavMenu } from "@/components/layouts/mobile-nav-menu";
import { NavbarHeader } from "@/components/layouts/navbar-header";
import { NavbarLinks, NAV_LINKS } from "@/components/layouts/navbar-links";
import { cn } from "@/lib/utils";

function LogoLockup() {
  return (
    <div data-nav-edge>
      <Link
        href="/"
        aria-label="Vyom — home"
        className="inline-flex items-center py-1 text-neutral-900 dark:text-foreground hover:opacity-75 transition-opacity"
      >
        <Wordmark className="text-3xl leading-none" />
      </Link>
    </div>
  );
}

interface NavbarProps {
  className?: string;
}

/**
 * Floating minimal storefront navigation — no full-width background bar.
 * Left: Devanagari व्योम wordmark.
 * Centre: Apple-style pill with sliding active bubble (Store, Community, About Us).
 * Right: 3 icon symbols (Cart, Theme, Profile) + mobile drawer trigger.
 */
export async function Navbar({ className }: NavbarProps) {
  const hasAuth = await hasSupabaseAuthCookie();
  let user: User | null = null;
  if (hasAuth) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const [cartItemCount, admin] = await Promise.all([
    getCurrentCartItemCount(user),
    user?.email ? isAdminEmail(user.email) : Promise.resolve(false),
  ]);

  return (
    <NavbarHeader className={className}>
      <div className="relative flex h-16 w-full items-center justify-between px-5 sm:px-8">
        <LogoLockup />

        <NavbarLinks />

        <div data-nav-edge className="flex items-center gap-1.5 [&_svg]:!size-5">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={
              cartItemCount > 0 ? `Cart, ${cartItemCount} items` : "Cart"
            }
            className="relative text-neutral-800 dark:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Link href="/cart">
              <ShoppingCart className="size-5" />
              {cartItemCount > 0 ? (
                <span
                  className={cn(
                    "absolute -top-0.5 -right-0.5",
                    "min-w-[18px] h-[18px] px-1 rounded-full",
                    "bg-brand text-brand-foreground",
                    "text-[10px] font-semibold leading-[18px] text-center",
                    "tabular-nums tracking-tight",
                  )}
                  aria-hidden="true"
                >
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              ) : null}
            </Link>
          </Button>
          <ThemeToggle className="text-neutral-800 dark:text-foreground hover:bg-black/5 dark:hover:bg-white/10" />
          {user ? (
            <UserMenu user={user as User} isAdmin={admin} />
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Profile — Sign in"
              className="text-neutral-800 dark:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Link href="/sign-in">
                <UserIcon className="size-5" />
              </Link>
            </Button>
          )}
          <MobileNavMenu links={NAV_LINKS} signedIn={Boolean(user)} />
        </div>
      </div>
    </NavbarHeader>
  );
}
