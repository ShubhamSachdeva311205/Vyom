"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createRazorpayOrder,
  verifyPaymentAndCompleteOrder,
} from "@/actions/checkout";
import { getShippingQuote } from "@/actions/shipping";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

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

type QuoteResult =
  | { kind: "ok"; ratePaise: number; courierName: string; etd: string }
  | { kind: "error"; message: string };

type QuoteState = QuoteResult | { kind: "idle" } | { kind: "loading" };

export function CheckoutForm({
  subtotalPaise,
  razorpayKeyId,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scriptReady, setScriptReady] = useState(false);
  const [pincode, setPincode] = useState("");
  // Most recent async result keyed by the pincode it was for. The
  // displayed `quote` is DERIVED from this + the current pincode so
  // the effect never has to synchronously setState (React 19 lint
  // forbids that).
  const [asyncQuote, setAsyncQuote] = useState<{
    pincode: string;
    result: QuoteResult;
  } | null>(null);

  const validPincode = PINCODE_REGEX.test(pincode);
  const quote: QuoteState = !validPincode
    ? { kind: "idle" }
    : asyncQuote?.pincode === pincode
      ? asyncQuote.result
      : { kind: "loading" };

  useEffect(() => {
    if (!validPincode) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await getShippingQuote({ pincode });
      if (cancelled) return;
      if (!result.success) {
        setAsyncQuote({ pincode, result: { kind: "error", message: result.error } });
        return;
      }
      const data = result.data;
      if (!data) {
        setAsyncQuote({ pincode, result: { kind: "error", message: "No quote returned." } });
        return;
      }
      setAsyncQuote({
        pincode,
        result: {
          kind: "ok",
          ratePaise: data.ratePaise,
          courierName: data.courierName,
          etd: data.etd,
        },
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pincode, validPincode]);

  const shippingPaise = quote.kind === "ok" ? quote.ratePaise : 0;
  const projectedTotalPaise = subtotalPaise + shippingPaise;

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (!scriptReady || !window.Razorpay) {
        toast.error("Payment library still loading. Try again in a second.");
        return;
      }

      const result = await createRazorpayOrder(formData);
      if (!result.success) {
        console.error("[checkout] createRazorpayOrder failed:", result.error);
        toast.error(result.error);
        return;
      }

      const order = result.data;
      if (!order) {
        console.error("[checkout] createRazorpayOrder returned empty data");
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
              console.error("[checkout] verify failed:", verifyResult.error, response);
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
              description="student10 or teacher10. Vendor codes also accepted. Codes apply on this website only — Amazon orders aren't eligible."
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
              description="Live Shiprocket rates fetched on entry."
            >
              <Input
                name="pincode"
                inputMode="numeric"
                pattern="[1-9][0-9]{5}"
                placeholder="6-digit pincode"
                autoComplete="postal-code"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </FormField>

            <div className="border-t border-border pt-4">
              <Stack gap={2}>
                <Row align="center" justify="between">
                  <Label className="text-body text-muted-foreground">Subtotal</Label>
                  <span className="text-body tabular-nums">
                    {formatINR(subtotalPaise)}
                  </span>
                </Row>

                <Row align="center" justify="between">
                  <Label className="text-body text-muted-foreground">Shipping</Label>
                  <span className="text-body tabular-nums">
                    {quote.kind === "loading" ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        Quoting…
                      </span>
                    ) : quote.kind === "ok" ? (
                      formatINR(quote.ratePaise)
                    ) : quote.kind === "error" ? (
                      <span className="text-destructive text-caption">{quote.message}</span>
                    ) : (
                      <span className="text-muted-foreground text-caption">
                        Enter pincode for quote
                      </span>
                    )}
                  </span>
                </Row>

                {quote.kind === "ok" ? (
                  <p className="text-caption text-muted-foreground">
                    Via {quote.courierName} · ETA {quote.etd}
                  </p>
                ) : null}

                <Row
                  align="center"
                  justify="between"
                  className="border-t border-border pt-2 mt-1"
                >
                  <Label className="text-headline">Total</Label>
                  <span className="text-headline tabular-nums">
                    {formatINR(projectedTotalPaise)}
                  </span>
                </Row>
                <p className="text-caption text-muted-foreground">
                  Discount applies on the Razorpay screen. GST: included.
                </p>
              </Stack>
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
