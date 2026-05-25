"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Toaster — mount once at the root of every app. Styled via Sonner's
 * theme prop so light/dark follows next-themes, with the visual nudged
 * to match our tokens (rounded, popover bg, border).
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={(resolvedTheme as "light" | "dark") ?? "dark"}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton: "bg-brand text-brand-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
        },
      }}
    />
  );
}

export { toast };
