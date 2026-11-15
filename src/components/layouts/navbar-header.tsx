"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Client wrapper for the barless storefront Navbar.
 * While over the white/pastel hand-drawn hero on `/`, forces dark ink
 * (`#171717`) on the left wordmark and right icon controls (`[data-nav-edge]`)
 * even if the user toggles dark mode, without overriding the active bubble
 * inside the centre pill.
 */
export function NavbarHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      setPastHero(window.scrollY > window.innerHeight * 2.15);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const forceDarkInk = isHome && !pastHero;

  return (
    <header
      data-on-hero={forceDarkInk ? "true" : undefined}
      className={cn(
        "sticky top-0 z-30 w-full bg-transparent transition-colors duration-200",
        forceDarkInk
          ? "[&_[data-nav-edge]]:!text-neutral-900 [&_[data-nav-edge]_a]:!text-neutral-900 [&_[data-nav-edge]_button]:!text-neutral-900 [&_[data-nav-edge]_svg]:!text-neutral-900"
          : "text-foreground",
        className,
      )}
    >
      {children}
    </header>
  );
}
