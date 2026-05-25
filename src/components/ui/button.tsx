import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Button — foundational interactive primitive.
 *
 * Variants:
 *   default     → high-contrast pill (Mode A primary CTA, also valid in Mode B)
 *   secondary   → muted surface fill
 *   outline     → 1px border, transparent fill
 *   ghost       → no surface, hover-only background
 *   destructive → for irreversible operator actions in Mode B
 *   link        → inline link styling
 *
 * Sizes follow the 44px minimum touch target rule from CLAUDE.md §10.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-medium",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:
          "bg-transparent text-foreground underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-5 text-sm rounded-full",
        lg: "h-12 px-7 text-base rounded-full",
        icon: "h-11 w-11 rounded-full",
      },
      shape: {
        pill: "",
        square: "",
      },
    },
    compoundVariants: [
      { size: "sm", shape: "square", class: "rounded-md" },
      { size: "md", shape: "square", class: "rounded-md" },
      { size: "lg", shape: "square", class: "rounded-md" },
      { size: "icon", shape: "square", class: "rounded-md" },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      shape: "pill",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size, shape }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
