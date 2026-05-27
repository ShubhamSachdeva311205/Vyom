import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin";
import { getCurrentCartItemCount } from "@/lib/cart/queries";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/ui/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/ui/user-menu";
import { MobileNavMenu } from "@/components/layouts/mobile-nav-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/store", label: "Store" },
  { href: "/ibdp", label: "IBDP" },
  { href: "/igcse", label: "IGCSE" },
  { href: "/community", label: "Community" },
] as const;

function LogoLockup() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
    >
      <Mascot name="wisp" size="xs" hideCoupon />
      <span className="font-display text-base font-semibold tracking-[-0.02em]">Advaita</span>
    </Link>
  );
}

interface NavbarProps {
  className?: string;
}

/**
 * Mode A storefront navbar. Server component — fetches the Supabase
 * user once so the signed-in/out chrome renders without a client-side
 * roundtrip. The mobile menu trigger is a small client island.
 */
export async function Navbar({ className }: NavbarProps) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    cartItemCount,
  ] = await Promise.all([supabase.auth.getUser(), getCurrentCartItemCount()]);

  const admin = isAdminEmail(user?.email);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full",
        "bg-background/70 backdrop-blur-xl border-b border-border/40",
        "op:bg-background op:backdrop-blur-none op:border-border",
        className,
      )}
    >
      {/* Full-width navbar with tight edge-hugging padding so items
          sit visibly on the viewport edges. */}
      <div className="w-full px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <LogoLockup />

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm text-muted-foreground",
                  "hover:text-foreground hover:bg-accent/50 transition-colors duration-150",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label={
                cartItemCount > 0 ? `Cart, ${cartItemCount} items` : "Cart"
              }
              className="relative"
            >
              <Link href="/cart">
                <ShoppingBag />
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
              <Button asChild variant="ghost" size="sm" shape="square" className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
            <MobileNavMenu links={NAV_LINKS} signedIn={Boolean(user)} />
          </div>
        </div>
      </div>
    </header>
  );
}
