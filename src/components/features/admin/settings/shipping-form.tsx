"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateShippingSettings } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/layouts/stack";
import type { ShippingSettings } from "@/lib/settings/queries";

export function ShippingForm({ initial }: { initial: ShippingSettings }) {
  const [enabled, setEnabled] = useState(initial.freeShippingEnabled);
  const [thresholdRupees, setThresholdRupees] = useState(
    String(Math.round(initial.freeShippingThresholdPaise / 100)),
  );
  const [pickupPincode, setPickupPincode] = useState(initial.pickupPincode ?? "");
  const [pickupLocation, setPickupLocation] = useState(initial.pickupLocation);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const thresholdPaise = Math.max(0, parseInt(thresholdRupees || "0", 10)) * 100;
    startTransition(async () => {
      const result = await updateShippingSettings({
        freeShippingEnabled: enabled,
        freeShippingThresholdPaise: thresholdPaise,
        pickupPincode: pickupPincode || undefined,
        pickupLocation,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSaved(true);
      toast.success("Shipping settings saved.");
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={3}>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={enabled}
            onCheckedChange={(c) => setEnabled(Boolean(c))}
          />
          <div>
            <span className="text-body font-medium">Free shipping below threshold</span>
            <p className="text-caption text-muted-foreground">
              If the Shiprocket quote is less than the threshold, we eat
              the cost and the customer pays ₹0.
            </p>
          </div>
        </label>

        <FormField
          label="Free shipping threshold (₹)"
          description={
            enabled
              ? "Customer pays ₹0 when the courier rate is under this."
              : "Ignored while free shipping is off."
          }
        >
          <Input
            type="number"
            min={0}
            value={thresholdRupees}
            onChange={(e) => setThresholdRupees(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Pickup pincode"
            description="Mom's warehouse pincode (Shiprocket origin)."
          >
            <Input
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              value={pickupPincode}
              onChange={(e) => setPickupPincode(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </FormField>
          <FormField
            label="Pickup location name"
            description={`Nickname of Mom's saved address in Shiprocket. Default "Primary".`}
          >
            <Input
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
          </FormField>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save shipping settings
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="size-4" aria-hidden="true" /> Saved
            </span>
          ) : null}
        </div>

        <Label className="sr-only">end</Label>
      </Stack>
    </form>
  );
}
