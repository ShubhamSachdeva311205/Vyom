import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      tight: "py-10 sm:py-14",
      default: "py-16 sm:py-24",
      loose: "py-24 sm:py-32",
      none: "",
    },
  },
  defaultVariants: { spacing: "default" },
});

export interface SectionProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, ...props }, ref) => (
    <section ref={ref} className={cn(sectionVariants({ spacing }), className)} {...props} />
  ),
);
Section.displayName = "Section";
