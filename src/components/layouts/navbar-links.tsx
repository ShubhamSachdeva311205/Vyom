"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { key: "store", href: "/store", label: "Store" },
  { key: "community", href: "/community", label: "Community" },
  { key: "about", href: "/contact", label: "About Us" },
] as const;

type NavKey = (typeof NAV_LINKS)[number]["key"];

/**
 * Center navigation pill with a fluid sliding bubble indicator showing
 * which section/page the user is currently viewing (`Store`, `Community`,
 * or `About Us`).
 *
 * - On `/`: scrolling down past the hand-drawn hero into `#store` lights up
 *   the `Store` bubble automatically; clicking `Store` smoothly scrolls
 *   down to `#store` on the same page with zero network roundtrip.
 * - On `/store`, `/community`, `/contact`: lights up the matching bubble.
 */
export function NavbarLinks() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [homeInStore, setHomeInStore] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      const storeEl = document.getElementById("store");
      if (storeEl) {
        const rect = storeEl.getBoundingClientRect();
        setHomeInStore(rect.top <= window.innerHeight * 0.45);
      } else {
        setHomeInStore(window.scrollY >= window.innerHeight * 1.35);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  let activeKey: NavKey | null = null;
  if (
    pathname.startsWith("/store") ||
    pathname.startsWith("/ibdp") ||
    pathname.startsWith("/igcse") ||
    (isHome && homeInStore)
  ) {
    activeKey = "store";
  } else if (pathname.startsWith("/community")) {
    activeKey = "community";
  } else if (pathname.startsWith("/contact")) {
    activeKey = "about";
  }

  function handleStoreClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!isHome) return;
    const storeEl = document.getElementById("store");
    if (storeEl) {
      e.preventDefault();
      storeEl.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", "/#store");
    }
  }

  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 rounded-full border border-neutral-200/80 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 p-1 shadow-xs backdrop-blur-md"
    >
      {NAV_LINKS.map((link) => {
        const isActive = activeKey === link.key;
        return (
          <Link
            key={link.key}
            href={link.href}
            prefetch={true}
            onClick={link.key === "store" ? handleStoreClick : undefined}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-sm font-medium tracking-tight transition-colors duration-200",
              isActive
                ? "text-white dark:text-neutral-900"
                : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="vyom-nav-bubble"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="
                  absolute inset-0 -z-10 rounded-full
                  bg-neutral-900 dark:bg-white shadow-xs
                "
              />
            ) : null}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
