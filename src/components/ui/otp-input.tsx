"use client";

import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * 6-digit OTP input. Six text boxes, autofocus moves forward on input,
 * backspace moves back. Paste a 6-digit code anywhere and it fans out
 * across the boxes.
 *
 * Renders a hidden `name=token` input with the combined value so it
 * works inside any standard <form>.
 */

interface OtpInputProps {
  name?: string;
  length?: number;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function OtpInput({
  name = "token",
  length = 6,
  onChange,
  onComplete,
  disabled,
  ariaLabel = "Verification code",
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const hiddenRef = useRef<HTMLInputElement | null>(null);

  const setValue = () => {
    const value = refs.current.map((el) => el?.value ?? "").join("");
    if (hiddenRef.current) hiddenRef.current.value = value;
    onChange?.(value);
    if (value.length === length && /^\d+$/.test(value)) onComplete?.(value);
  };

  const handleChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (refs.current[i]) refs.current[i].value = digit;
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
    setValue();
  };

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !refs.current[i]?.value && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    text.split("").forEach((d, i) => {
      if (refs.current[i]) refs.current[i].value = d;
    });
    setValue();
    const next = Math.min(text.length, length - 1);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center gap-2 justify-center"
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
          className={cn(
            "h-12 w-10 text-center text-lg font-mono tracking-widest",
            "rounded-md border border-border bg-input text-foreground",
            "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />
      ))}
      <input ref={hiddenRef} type="hidden" name={name} />
    </div>
  );
}
