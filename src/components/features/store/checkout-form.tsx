"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createRazorpayOrder,
  verifyPaymentAndCompleteOrder,
} from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Minimal Razorpay Checkout types — the SDK script attaches a global
// `Razorpay` constructor that takes an options bag and exposes .open().
// Typed locally so we don't depend on @types/razorpay which is sparse.
interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): { open: () => void };
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

interface CheckoutFormProps {
  subtotalPaise: number;
  razorpayKeyId: string;
  userEmail: string;
  userName: string;
}

/**
 * CheckoutForm — coupon + pincode inputs + the Razorpay modal trigger.
 *
 * Flow:
 *   1. User enters optional coupon + pincode, clicks Pay.
 *   2. createRazorpayOrder runs server-side: validates, inserts our
 *      pending_payment order + items, atomically redeems coupon if
 *      provided, creates the Razorpay order via SDK, returns ids.
 *   3. We load checkout.razorpay.com/v1/checkout.js (via next/script)
 *      and open the modal with the returned ids.
 *   4. On modal success → verifyPaymentAndCompleteOrder runs
 *      HMAC-SHA256 verify + flips the order to 'paid' + clears the cart.
 *   5. Redirect to /order/[id]/success.
 */
export function CheckoutForm({
  subtotalPaise,
  razorpayKeyId,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scriptReady, setScriptReady] = useState(false);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (!scriptReady || !window.Razorpay) {
        toast.error("Payment library still loading. Try again in a second.");
        return;
      }

      const result = await createRazorpayOrder(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const order = result.data;
      if (!order) {
        toast.error("Server returned an empty order. Try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Advaita",
        description: `Order ${order.orderNumber}`,
        order_id: order.razorpayOrderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#10b981" },
        handler: (response) => {
          startTransition(async () => {
            const verifyResult = await verifyPaymentAndCompleteOrder(response);
            if (!verifyResult.success) {
              toast.error(verifyResult.error);
              return;
            }
            const orderId = verifyResult.data?.orderId;
            if (orderId) {
              router.push(`/order/${orderId}/success`);
              router.refresh();
            }
          });
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying. Order stays in
            // pending_payment — they can retry from /checkout (we
            // could also revoke it; leaving it for the admin to see.)
            toast.message("Payment cancelled. Your cart is unchanged.");
          },
        },
      });
      rzp.open();
    });
  };

  return (
    <>
      <Script
        src={RAZORPAY_SCRIPT_SRC}
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
        onError={() =>
          toast.error("Could not load Razorpay. Check your network and refresh.")
        }
      />

      <Card variant="surface" padding="lg">
        <form action={handleSubmit}>
          <Stack gap={4}>
            <FormField
              label="Coupon code"
              description="student10 or teacher10. Vendor codes also accepted."
            >
              <Input
                name="couponCode"
                placeholder="e.g. student10"
                autoComplete="off"
                maxLength={40}
              />
            </FormField>

            <FormField
              label="Shipping pincode"
              description="Live Delhivery rates arrive in Phase 3.3 — shipping is ₹0 for now."
            >
              <Input
                name="pincode"
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                placeholder="6-digit pincode"
                autoComplete="postal-code"
                maxLength={6}
              />
            </FormField>

            <div className="border-t border-border pt-4">
              <Row align="center" justify="between">
                <Label className="text-body text-muted-foreground">Subtotal</Label>
                <span className="text-headline tabular-nums">
                  {formatINR(subtotalPaise)}
                </span>
              </Row>
              <p className="text-caption mt-1">
                Discount + shipping + GST are calculated on the next screen.
              </p>
            </div>

            <Button type="submit" size="md" disabled={pending || !scriptReady} className="w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Opening Razorpay…
                </>
              ) : (
                "Pay with Razorpay"
              )}
            </Button>
          </Stack>
        </form>
      </Card>
    </>
  );
}
