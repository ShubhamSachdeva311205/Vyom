"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CouponChip — small mono pill that copies a discount code to clipboard
 * on click. Styled to feel like a Nothing-phone tag: dense mono caps,
 * wide tracking, monolithic surface.
 *
 * Used inside Mascot blobs for the discount Easter egg and anywhere
 * else a copy-on-click code surface is needed.
 */

interface CouponChipProps {
  code: string;
  className?: string;
}

export function CouponChip({ code, className }: CouponChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard not available (insecure context, denied perm). Fall
      // back to selecting text via a transient input — handled by the
      // browser via the user's copy shortcut. We do not throw.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
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
