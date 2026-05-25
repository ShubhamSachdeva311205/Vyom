"use client";

import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Mascot } from "@/components/ui/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Container } from "@/components/layouts/container";
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
      className="inline-flex items-center gap-2 -ml-1 px-1 py-1 rounded-md hover:bg-accent/50 transition-colors"
    >
      <Mascot name="star" size="sm" hideCoupon className="!h-9 !w-9" />
      <span className="font-display text-base font-semibold tracking-[-0.02em]">Advaita</span>
    </Link>
  );
}

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full",
        "bg-background/70 backdrop-blur-xl border-b border-border/40",
        "op:bg-background op:backdrop-blur-none op:border-border",
        className,
      )}
    >
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <LogoLockup />

          {/* Desktop nav */}
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
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingBag />
            </Button>
            <ThemeToggle />

            {/* Mobile menu */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="md:hidden"
                >
                  <Menu />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Menu</DrawerTitle>
                </DrawerHeader>
                <nav className="flex flex-col gap-1 px-6 pb-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-3 rounded-md text-base font-medium hover:bg-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </Container>
    </header>
  );
}
