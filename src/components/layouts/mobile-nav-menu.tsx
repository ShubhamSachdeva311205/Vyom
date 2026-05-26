"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Stack } from "@/components/layouts/stack";

/**
 * Mobile nav trigger + drawer. Receives signedIn from the server-rendered
 * Navbar so the menu surfaces the right links without a client roundtrip.
 */
export function MobileNavMenu({
  links,
  signedIn,
}: {
  links: readonly { href: string; label: string }[];
  signedIn: boolean;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <Menu />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
        </DrawerHeader>
        <nav className="flex flex-col gap-1 px-6 pb-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-3 rounded-md text-base font-medium hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 pb-6 pt-2 border-t border-border/40">
          {signedIn ? (
            <Stack gap={1}>
              <Link
                href="/dashboard"
                className="px-3 py-3 rounded-md text-base font-medium hover:bg-accent transition-colors"
              >
                Your library
              </Link>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  shape="square"
                  className="w-full justify-start"
                >
                  Sign out
                </Button>
              </form>
            </Stack>
          ) : (
            <Stack gap={2}>
              <Button asChild size="md" shape="square" className="w-full">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="md" shape="square" variant="outline" className="w-full">
                <Link href="/sign-up">Create account</Link>
              </Button>
            </Stack>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
