"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * FormField — wraps a Label + control + helper/error text and wires up
 * id / htmlFor / aria-describedby / aria-invalid automatically.
 *
 * Usage:
 *   <FormField label="Email" description="Where receipts go.">
 *     <Input name="email" type="email" />
 *   </FormField>
 *
 *   <FormField label="Email" error="Invalid email.">
 *     <Input name="email" />
 *   </FormField>
 *
 * The child must be a single form control that accepts id, aria-describedby,
 * and aria-invalid (Input / Textarea / Select trigger / etc.).
 */

interface FormFieldContextValue {
  controlId: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormFieldContext() {
  return useContext(FormFieldContext);
}

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Pass `false` to skip rendering the Label entirely (useful for grouped controls
   *  where the label sits elsewhere). */
  showLabel?: boolean;
  children: ReactElement;
}

export function FormField({
  label,
  description,
  error,
  required,
  showLabel = true,
  className,
  children,
  ...rest
}: FormFieldProps) {
  const controlId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const hasError = Boolean(error);

  const describedBy =
    [hasError ? errorId : null, description ? descriptionId : null].filter(Boolean).join(" ") ||
    undefined;

  const ctx = useMemo<FormFieldContextValue>(
    () => ({ controlId, descriptionId, errorId, hasError }),
    [controlId, descriptionId, errorId, hasError],
  );

  // Inject a11y wiring into the single child control.
  const onlyChild = Children.only(children);
  const enhanced = isValidElement(onlyChild)
    ? cloneElement(onlyChild, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": hasError || undefined,
        state: hasError ? "error" : (onlyChild.props as { state?: string }).state,
      } as Partial<typeof onlyChild.props>)
    : onlyChild;

  return (
    <FormFieldContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-1.5", className)} {...rest}>
        {showLabel && label ? (
          <Label htmlFor={controlId} required={required}>
            {label}
          </Label>
        ) : null}
        {enhanced}
        {hasError ? (
          <p id={errorId} className="text-xs text-destructive">
            {error}
          </p>
        ) : description ? (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </FormFieldContext.Provider>
  );
}
