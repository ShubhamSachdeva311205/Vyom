"use client";

import { Check, Copy } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/**
 * CouponChip — small mono pill that copies a discount code on click.
 * Visible feedback via a "Copied" state on the button itself AND a
 * sonner toast (so a user who's already moved their cursor away still
 * sees that the copy happened).
 *
 * The chip lives inside Framer Motion wrappers (Mascot uses whileTap)
 * which can swallow click intent if we don't stopPropagation on the
 * pointer events. The clipboard API also fails silently in some
 * browser contexts — we fall back to an execCommand("copy") with a
 * transient textarea so insecure-context / older browsers still work.
 */

interface CouponChipProps {
  code: string;
  className?: string;
}

function execCommandCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

export function CouponChip({ code, className }: CouponChipProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    // Don't let the parent Mascot's whileTap consume this gesture.
    event.stopPropagation();
    event.preventDefault();

    const succeed = () => {
      setCopied(true);
      toast.success(`Copied ${code}`);
      window.setTimeout(() => setCopied(false), 1800);
    };

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(code);
        succeed();
        return;
      } catch {
        // fall through to execCommand
      }
    }

    if (execCommandCopy(code)) {
      succeed();
      return;
    }

    toast.error("Couldn't copy. Long-press to copy manually.");
  };

  // Also block the parent's pointer handlers — Framer's whileTap fires
  // on pointer down, which can interfere with the synthetic click event
  // in some browsers.
  const stop = (e: MouseEvent<HTMLButtonElement>) => e.stopPropagation();

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={stop}
      onPointerUp={stop}
      aria-label={copied ? "Copied" : `Copy discount code ${code}`}
      className={cn(
        "group/chip relative inline-flex items-center gap-2",
        "rounded-full border border-foreground/10",
        "bg-foreground text-background",
        "px-3 py-1.5",
        "shadow-sm transition-transform duration-150 ease-out",
        "active:scale-[0.97] hover:scale-[1.03]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="text-mono-tag">{copied ? "Copied" : code}</span>
      <span aria-hidden="true" className="inline-flex">
        {copied ? (
          <Check className="size-3.5" strokeWidth={2.5} />
        ) : (
          <Copy className="size-3.5 opacity-70 group-hover/chip:opacity-100 transition-opacity" />
        )}
      </span>
    </button>
  );
}
