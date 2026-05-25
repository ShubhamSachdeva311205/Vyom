import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton — token-driven loading placeholder.
 * Shape variants map to common slot types: line (text rows), block
 * (cards / images), circle (avatars / mascots).
 */
const skeletonVariants = cva("animate-pulse bg-muted/80", {
  variants: {
    shape: {
      line: "h-4 w-full rounded-md",
      block: "h-32 w-full rounded-xl",
      circle: "h-12 w-12 rounded-full",
    },
  },
  defaultVariants: { shape: "line" },
});

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ shape }), className)} {...props} />;
}
