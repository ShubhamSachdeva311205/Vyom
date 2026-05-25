"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm op:bg-foreground/55 op:backdrop-blur-none",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
        "w-[calc(100%-2rem)] max-w-lg",
        "bg-popover text-popover-foreground border border-border shadow-xl",
        "rounded-2xl op:rounded-lg",
        "p-6",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4 rounded-md p-1 text-muted-foreground",
          "transition-colors duration-150 hover:bg-accent hover:text-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label="Close"
      >
        <X className="size-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 text-left pr-8", className)} {...props} />;
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4", className)}
      {...props}
    />
  );
}

const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-headline text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-caption", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
