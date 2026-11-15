"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { key: "store", href: "/store", label: "Store" },
  { key: "community", href: "/community", label: "Community" },
  { key: "about", href: "/contact", label: "About Us" },
] as const;

type NavKey = (typeof NAV_LINKS)[number]["key"];

/**
 * Center navigation pill with a fluid horizontal sliding bubble indicator
 * showing which section/page the user is currently viewing (`Store`,
 * `Community`, or `About Us`).
 *
 * Uses container-relative `offsetLeft` / `offsetWidth` + `inset-y-1` on a
 * DOM ref so window scroll resets during route transitions never cause
 * vertical drift or extra React re-renders.
 */
export function NavbarLinks() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [homeInStore, setHomeInStore] = useState(false);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Record<NavKey, HTMLAnchorElement | null>>({
    store: null,
    community: null,
    about: null,
  });

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

  useLayoutEffect(() => {
    const pill = bubbleRef.current;
    if (!pill) return;
    if (!activeKey) {
      pill.style.opacity = "0";
      return;
    }
    const el = itemRefs.current[activeKey];
    if (!el) return;
    pill.style.left = `${el.offsetLeft}px`;
    pill.style.width = `${el.offsetWidth}px`;
    pill.style.opacity = "1";
  }, [activeKey]);

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
      <span
        ref={bubbleRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="pointer-events-none absolute inset-y-1 z-0 rounded-full bg-neutral-900 dark:bg-white shadow-xs transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
      {NAV_LINKS.map((link) => {
        const isActive = activeKey === link.key;
        return (
          <Link
            key={link.key}
            ref={(node) => {
              itemRefs.current[link.key] = node;
            }}
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
