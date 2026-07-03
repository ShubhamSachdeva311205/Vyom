"use client";

import Link from "next/link";
import { LogOut, User as UserIcon, Library } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Stack } from "@/components/layouts/stack";

/**
 * UserMenu — avatar trigger + popover with dashboard link + sign-out.
 * Rendered by Navbar only when a Supabase user is signed in.
 */

function initialsFor(user: User): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | null;
  const name = meta?.full_name ?? meta?.name ?? user.email ?? "";
  const parts = name.split(/[\s@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  const displayName =
    (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ??
    user.email ??
    "Account";
  const initials = initialsFor(user);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Account menu"
          className="text-mono-tag bg-accent/50 hover:bg-accent text-foreground"
        >
          {initials}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <Stack gap={3}>
          <Stack gap={1}>
            <span className="text-eyebrow">Signed in as</span>
            <p className="text-sm font-medium leading-tight">{displayName}</p>
            <p className="text-caption truncate">{user.email}</p>
          </Stack>

          <div className="h-px bg-border" />

          <Stack gap={1}>
            <MenuLink href="/dashboard" icon={<Library className="size-4" />}>
              Your library
            </MenuLink>
            <MenuLink href="/dashboard/settings" icon={<UserIcon className="size-4" />}>
              Account settings
            </MenuLink>
            {isAdmin ? (
              <MenuLink href="/admin" icon={<UserIcon className="size-4" />}>
                Admin panel
              </MenuLink>
            ) : null}
          </Stack>

          <div className="h-px bg-border" />

          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              shape="square"
              className="w-full justify-start"
            >
              <LogOut /> Sign out
            </Button>
          </form>
        </Stack>
      </PopoverContent>
    </Popover>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
