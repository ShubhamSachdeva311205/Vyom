import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  [
    "peer w-full min-h-24",
    "bg-input text-foreground placeholder:text-muted-foreground/70",
    "border border-border rounded-md",
    "px-3.5 py-3 text-sm",
    "resize-y",
    "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
    "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ],
  {
    variants: {
      state: {
        default: "",
        error: "border-destructive focus:border-destructive focus:ring-destructive/30",
      },
    },
    defaultVariants: { state: "default" },
  },
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state, ...props }, ref) => (
    <textarea ref={ref} className={cn(textareaVariants({ state }), className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
