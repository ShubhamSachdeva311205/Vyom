"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Tiny one-tap copy control (#118) for order numbers / AWBs — removes fiddly
 * mobile text-selection. Shows a check + "Copied" for a moment after copying.
 */
export function CopyInline({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy ${label ?? value}`}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors align-middle"
    >
      {copied ? (
        <Check className="size-3.5 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      <span className="text-caption">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
