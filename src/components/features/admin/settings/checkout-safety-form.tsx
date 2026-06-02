"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCheckoutSafety } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/layouts/stack";
import type { CheckoutSafety } from "@/lib/settings/queries";

export function CheckoutSafetyForm({ initial }: { initial: CheckoutSafety }) {
  // Show as a percentage (0-100) for human-friendly editing.
  const [percent, setPercent] = useState(
    String(Math.round(initial.minPayableFraction * 100)),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const parsed = Number(percent);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Enter a number between 0 and 100.");
      return;
    }
    const fraction = parsed / 100;
    startTransition(async () => {
      const result = await updateCheckoutSafety({ minPayableFraction: fraction });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSaved(true);
      toast.success("Checkout safety saved.");
    });
  }

  const fractionPreview = (Number(percent) || 0) / 100;
  const exampleSubtotal = 1000;
  const exampleFloor = Math.floor(exampleSubtotal * fractionPreview);

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={3}>
        <FormField
          label="Minimum payable (% of subtotal)"
          description="If the computed total ever drops below this percentage of the cart subtotal, the order is refused. Defense-in-depth against an unknown discount bug or attacker."
        >
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            required
          />
        </FormField>

        <div className="rounded-md bg-muted/40 p-3 text-caption text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Example.</span>{" "}
            Cart subtotal ₹1,000 · floor at {percent || 0}% means the customer
            must pay at least <span className="font-medium text-foreground">
            ₹{exampleFloor.toLocaleString("en-IN")}</span>. Anything below
            refuses to reach Razorpay.
          </p>
          <p className="mt-1">
            Today&apos;s largest legit discount code is 10%. Leave this at 30
            unless you&apos;re rolling out a deep-discount sale.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save checkout safety
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="size-4" aria-hidden="true" /> Saved
            </span>
          ) : null}
        </div>
      </Stack>
    </form>
  );
}
