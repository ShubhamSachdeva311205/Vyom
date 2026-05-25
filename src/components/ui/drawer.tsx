"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

/**
 * Drawer — mobile-first bottom sheet via vaul. Same API shape as Dialog
 * so consumers can swap based on viewport (DialogTrigger / DrawerTrigger
 * are interchangeable). Use Drawer for full-screen actions on mobile,
 * Dialog for centered confirmations on desktop.
 */

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: ComponentPropsWithoutRef<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = forwardRef<
  ElementRef<typeof DrawerPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-foreground/40", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = forwardRef<
  ElementRef<typeof DrawerPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col",
        "rounded-t-2xl border-t border-border bg-popover text-popover-foreground",
        className,
      )}
      {...props}
    >
      {/* Drag handle */}
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-center sm:text-left p-6 pb-2", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-6 pt-2", className)} {...props} />;
}

const DrawerTitle = forwardRef<
  ElementRef<typeof DrawerPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn("text-headline", className)} {...props} />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = forwardRef<
  ElementRef<typeof DrawerPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("text-caption", className)} {...props} />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
