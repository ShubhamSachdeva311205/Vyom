"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removeCartItem, updateCartItemQuantity } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Row, Stack } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";

interface CartLineRowProps {
  cartItemId: string;
  bookTitle: string;
  bookSubtitle: string | null;
  bookSlug: string;
  unitPricePaise: number;
  quantity: number;
}

/**
 * CartLineRow — one row in the /cart line-items list. Quantity stepper
 * + remove button both call cart Server Actions. revalidatePath('/cart')
 * inside the actions causes the page to re-render with new totals.
 */
export function CartLineRow({
  cartItemId,
  bookTitle,
  bookSubtitle,
  bookSlug,
  unitPricePaise,
  quantity,
}: CartLineRowProps) {
  const [pending, startTransition] = useTransition();
  const lineSubtotal = unitPricePaise * quantity;

  const setQuantity = (next: number) => {
    startTransition(async () => {
      const result = await updateCartItemQuantity(cartItemId, next);
      if (!result.success) toast.error(result.error);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeCartItem(cartItemId);
      if (!result.success) toast.error(result.error);
      else toast.success("Removed from cart.");
    });
  };

  return (
    <div className="p-4 sm:p-5">
      <Row gap={4} align="start" className="flex-wrap sm:flex-nowrap">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={`/book-covers/${bookSlug}.webp`}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>

        <Stack gap={1} className="flex-1 min-w-0">
          <Link
            href={`/store/${bookSlug}`}
            className="text-sm font-medium leading-snug hover:underline line-clamp-2"
          >
            {bookTitle}
          </Link>
          {bookSubtitle ? (
            <p className="text-caption line-clamp-1">{bookSubtitle}</p>
          ) : null}
          <p className="text-caption">{formatINR(unitPricePaise)} each</p>
        </Stack>

        <Stack gap={2} align="end" className="ml-auto">
          <Row align="center" gap={1}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Decrease quantity"
              disabled={pending || quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
              className="size-9"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </Button>
            <span
              className="min-w-8 text-center text-sm font-medium tabular-nums"
              aria-live="polite"
              aria-label={`Quantity ${quantity}`}
            >
              {pending ? <Loader2 className="inline size-3.5 animate-spin" /> : quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Increase quantity"
              disabled={pending || quantity >= 99}
              onClick={() => setQuantity(quantity + 1)}
              className="size-9"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </Button>
          </Row>
          <Row align="center" gap={3}>
            <span className="text-sm font-semibold tabular-nums">
              {formatINR(lineSubtotal)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${bookTitle} from cart`}
              disabled={pending}
              onClick={remove}
              className="size-9 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </Row>
        </Stack>
      </Row>
    </div>
  );
}
