"use server";

/**
 * Shipping Server Actions — Phase 3.3.
 *
 * One action right now:
 *   getShippingQuote({ pincode })
 *     Computes the current cart's total weight, calls Shiprocket
 *     serviceability, returns the cheapest courier + rate. Used by
 *     the checkout form on pincode entry to show "Shipping: ₹X est."
 *     before the customer commits.
 *
 * createRazorpayOrder re-fetches the quote server-side so the client
 * can't tamper with the displayed price. The number shown here is
 * advisory.
 */

import { z } from "zod";
import { getCurrentCart } from "@/lib/cart/queries";
import { ShiprocketError, getServiceability } from "@/lib/shiprocket/client";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const quoteInput = z.object({
  pincode: z.string().regex(PINCODE_REGEX, "Pincode must be 6 digits"),
});

export interface ShippingQuote {
  ratePaise: number;
  courierName: string;
  etd: string;
  weightGrams: number;
}

export async function getShippingQuote(
  input: z.input<typeof quoteInput>,
): Promise<ActionResult<ShippingQuote>> {
  const parsed = quoteInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid pincode" };
  }

  const cart = await getCurrentCart();
  if (!cart || cart.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  // Sum cart weight. weight_grams isn't in the generated types yet —
  // cast through. Defaults to 300g per book if a row is missing the
  // column (which won't happen after the migration, but defensive).
  const weightGrams = cart.items.reduce((sum, it) => {
    const w = (it.book as unknown as { weight_grams?: number }).weight_grams ?? 300;
    return sum + w * it.quantity;
  }, 0);

  try {
    const { cheapest } = await getServiceability({
      deliveryPincode: parsed.data.pincode,
      weightGrams,
    });

    if (!cheapest) {
      return {
        success: false,
        error: "No couriers serve this pincode. Try a different one.",
      };
    }

    return {
      success: true,
      data: {
        ratePaise: Math.round(cheapest.rate * 100),
        courierName: cheapest.courier_name,
        etd: cheapest.etd,
        weightGrams,
      },
    };
  } catch (err) {
    const message =
      err instanceof ShiprocketError
        ? err.message
        : "Couldn't reach Shiprocket. Try again.";
    return { success: false, error: message };
  }
}
