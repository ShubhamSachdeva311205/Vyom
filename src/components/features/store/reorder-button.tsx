"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { reorderToCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";

/**
 * "Buy again" (#118) — re-adds a past order's items to the cart in one tap,
 * then takes the customer to /cart. Lines that are out of stock are skipped.
 */
export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const r = await reorderToCart(orderId);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      const added = r.data?.added ?? 0;
      const skipped = r.data?.skipped ?? 0;
      toast.success(
        skipped > 0
          ? `Added ${added} item${added === 1 ? "" : "s"} — ${skipped} unavailable.`
          : `Added ${added} item${added === 1 ? "" : "s"} to your cart.`,
      );
      router.push("/cart");
    });
  }

  return (
    <Button type="button" variant="outline" size="md" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <RotateCcw className="size-4" aria-hidden="true" />
      )}
      Buy again
    </Button>
  );
}
