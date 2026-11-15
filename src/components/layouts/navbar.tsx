import Link from "next/link";
import { ShoppingCart, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin";
import { getCurrentCartItemCount } from "@/lib/cart/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { UserMenu } from "@/components/ui/user-menu";
import { MobileNavMenu } from "@/components/layouts/mobile-nav-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/store", label: "Store" },
  { href: "/community", label: "Community" },
  { href: "/contact", label: "About Us" },
] as const;

function LogoLockup() {
  return (
    <Link
      href="/"
      aria-label="Vyom — home"
      className="inline-flex items-center py-1 text-foreground hover:opacity-75 transition-opacity"
    >
      <Wordmark className="text-3xl leading-none" />
    </Link>
  );
}

interface NavbarProps {
  className?: string;
}

/**
 * Floating minimal storefront navigation — no background bar or border.
 * Left: Devanagari व्योम wordmark.
 * Centre: Apple-style text links (Store, Community, About Us).
 * Right: 3 icon symbols (Cart, Theme, Profile) + mobile drawer trigger.
 */
export async function Navbar({ className }: NavbarProps) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    cartItemCount,
  ] = await Promise.all([supabase.auth.getUser(), getCurrentCartItemCount()]);

  const admin = await isAdminEmail(user?.email);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full bg-transparent",
        className,
      )}
    >
      <div className="relative flex h-16 w-full items-center justify-between px-5 sm:px-8">
        <LogoLockup />

        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-normal tracking-tight text-foreground/80 hover:text-foreground transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label={
              cartItemCount > 0 ? `Cart, ${cartItemCount} items` : "Cart"
            }
            className="relative hover:bg-black/5 dark:hover:bg-white/10"
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
          <ThemeToggle />
          {user ? (
            <UserMenu user={user as User} isAdmin={admin} />
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Profile — Sign in"
              className="hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Link href="/sign-in">
                <UserIcon className="size-5" />
              </Link>
            </Button>
          )}
          <MobileNavMenu links={NAV_LINKS} signedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
