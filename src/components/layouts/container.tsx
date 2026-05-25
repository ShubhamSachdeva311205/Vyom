import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-6 sm:px-8", {
  variants: {
    size: {
      page: "max-w-6xl",
      wide: "max-w-7xl",
      form: "max-w-lg",
      reading: "max-w-3xl",
    },
  },
  defaultVariants: { size: "page" },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => (
    <div ref={ref} className={cn(containerVariants({ size }), className)} {...props} />
  ),
);
Container.displayName = "Container";
