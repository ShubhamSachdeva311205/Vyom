import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
      12: "gap-12",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: { gap: 4, align: "stretch" },
});

const rowVariants = cva("flex flex-row", {
  variants: {
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: { gap: 4, align: "center", justify: "start", wrap: false },
});

export interface StackProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, ...props }, ref) => (
    <div ref={ref} className={cn(stackVariants({ gap, align }), className)} {...props} />
  ),
);
Stack.displayName = "Stack";

export interface RowProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rowVariants> {}

export const Row = forwardRef<HTMLDivElement, RowProps>(
  ({ className, gap, align, justify, wrap, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(rowVariants({ gap, align, justify, wrap }), className)}
      {...props}
    />
  ),
);
Row.displayName = "Row";
