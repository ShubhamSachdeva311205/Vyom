import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  [
    "peer w-full",
    "bg-input text-foreground placeholder:text-muted-foreground/70",
    "border border-border",
    "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
    "focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ],
  {
    variants: {
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-3.5 text-sm rounded-md",
        lg: "h-12 px-4 text-base rounded-lg",
      },
      state: {
        default: "",
        error: "border-destructive focus:border-destructive focus:ring-destructive/30",
      },
    },
    defaultVariants: { size: "md", state: "default" },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, state, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ size, state }), className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { inputVariants };
