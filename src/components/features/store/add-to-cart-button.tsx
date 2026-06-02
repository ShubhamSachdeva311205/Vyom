"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, PackageX, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  bookId: string;
  /** Hidden from sighted readers but used by SR + tooltips. */
  bookTitle: string;
  className?: string;
  /** Full-width vs auto. */
  block?: boolean;
  /** When true, renders a disabled "Out of stock" button instead. */
  outOfStock?: boolean;
}

/**
 * AddToCartButton — wraps the cart Server Action with a tiny optimistic
 * UX:
 *   - default: "Add to cart" with bag icon
 *   - submitting: spinner, disabled
 *   - just-added: checkmark + "Added" for ~1.6s, then back to default
 *
 * On error, surfaces the action's `error` field via a sonner toast.
 */
export function AddToCartButton({
  bookId,
  bookTitle,
  className,
  block = false,
  outOfStock = false,
}: AddToCartButtonProps) {
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  if (outOfStock) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className={cn(block && "w-full", className)}
        aria-label={`${bookTitle} is out of stock`}
      >
        <PackageX className="size-4" aria-hidden="true" />
        Out of stock
      </Button>
    );
  }

  const handleClick = () => {
    startTransition(async () => {
      const result = await addToCart(bookId, 1);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setJustAdded(true);
      toast.success(`Added "${bookTitle}" to cart.`);
      setTimeout(() => setJustAdded(false), 1600);
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className={cn(block && "w-full", className)}
      aria-label={`Add ${bookTitle} to cart`}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Adding…
        </>
      ) : justAdded ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          Added
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden="true" />
          Add to cart
        </>
      )}
    </Button>
  );
}
