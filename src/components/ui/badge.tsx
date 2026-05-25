import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Badge — small pill for state, tags, counters. The status variants
 * (success / warning / pending / destructive) are the canonical Mode B
 * order-state colors from design-system-spec.md.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full",
    "px-2.5 py-0.5",
    "text-mono-tag",
    "border",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        default: "bg-foreground text-background border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        outline: "bg-transparent text-foreground border-border",
        brand: "bg-brand text-brand-foreground border-transparent",
        success: "bg-success/15 text-success border-success/25",
        warning: "bg-warning/20 text-warning-foreground border-warning/35 op:bg-warning/20 op:text-warning-foreground",
        pending: "bg-pending/15 text-pending border-pending/25",
        destructive: "bg-destructive/15 text-destructive border-destructive/25",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.625rem]",
        md: "px-2.5 py-0.5",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
  ),
);
Badge.displayName = "Badge";

export { badgeVariants };
