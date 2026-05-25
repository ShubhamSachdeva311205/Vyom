"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ErrorState — when a fetch/action fails. Always offers the user a clear
 * next step (retry, contact, go back). Destructive accent ring around the
 * icon; never raw error stack visible to user (CLAUDE.md §11).
 */

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Click handler for retry. If provided, renders a default Retry button. */
  onRetry?: () => void;
  /** Custom action(s) — replaces the default Retry button entirely. */
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong.",
  description = "We couldn't load this just now. Try again — the issue is on our side, not yours.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-12 px-6 gap-4",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/25">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="text-headline">{title}</h3>
        <p className="text-caption">{description}</p>
      </div>

      {action ?? (
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCcw /> Try again
          </Button>
        ) : null
      )}
    </div>
  );
}
