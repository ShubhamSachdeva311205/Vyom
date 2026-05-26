"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Subscribe-less external store: server snapshot = false, client = true.
// Lets us know we're on the client without triggering the cascading
// render that `useState + useEffect` does (react-hooks/set-state-in-effect).
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * ThemeToggle — single button that flips between light and dark.
 * SSR-safe: renders a static placeholder until mounted so the icon doesn't
 * flicker on first paint (next-themes hydration guard).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("relative", className)}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        // Reserve space pre-hydration so the toggle doesn't shift in.
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
