"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  cancelPendingOrder,
  createRazorpayOrder,
  previewCheckoutTotals,
  verifyPaymentAndCompleteOrder,
} from "@/actions/checkout";
import { lookupPincode } from "@/actions/pincode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const COUPON_REGEX = /^[A-Za-z0-9-_]{3,40}$/;

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

interface PreviewSnapshot {
  couponCode: string;
  pincode: string;
  data:
    | { kind: "ok"; subtotalPaise: number; discountPaise: number; shippingPaise: number; totalPaise: number; couponApplied: string | null; couponReason: string | null; shippingCourier: string | null; shippingEtd: string | null; shippingUnserviceable: boolean }
    | { kind: "error"; message: string };
}

export function CheckoutForm({
  subtotalPaise,
  razorpayKeyId,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scriptReady, setScriptReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [pincode, setPincode] = useState("");
  // City + State are controlled so a pincode lookup can auto-fill them
  // (#117). The customer can still edit them by hand.
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincodeResolving, setPincodeResolving] = useState(false);
  // Name + phone are uncontrolled (plain inputs with `required`)
  // so browser autofill works without React's controlled-state bug
  // where autofill doesn't fire onChange and we never know the field
  // is filled. We do our own validation on submit (see handleSubmit)
  // and show inline error captions — the browser's native popover is
  // not styleable and looks broken in Zen / some other browsers.
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
  }>({});
  // Customer must acknowledge no-refunds before Pay enables. Tracked
  // in React state so the button gate sees it (no autofill concern —
  // checkbox value isn't autofilled).
  const [acknowledgedNoRefund, setAcknowledgedNoRefund] = useState(false);
  const [preview, setPreview] = useState<PreviewSnapshot | null>(null);

  const validPincode = PINCODE_REGEX.test(pincode);
  const validCoupon = couponCode === "" || COUPON_REGEX.test(couponCode);

  // Auto-fill City + State from a valid pincode (#117). Debounced;
  // overwrites on each new valid pincode (a pincode change means a new
  // location). Manual edits afterwards stick until the pincode changes.
  useEffect(() => {
    if (!validPincode) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      // setState inside the async callback (not directly in the effect
      // body) to satisfy React 19's set-state-in-effect rule.
      setPincodeResolving(true);
      const r = await lookupPincode(pincode);
      if (cancelled) return;
      setPincodeResolving(false);
      if (r.success && r.data) {
        setCity(r.data.city);
        setStateName(r.data.state);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pincode, validPincode]);

  // Match the last preview against the current inputs. If they don't
  // match, we're either loading or idle.
  const matches =
    preview?.couponCode === couponCode && preview?.pincode === pincode;
  const previewState =
    matches && preview
      ? preview.data
      : validPincode || couponCode
        ? { kind: "loading" as const }
        : { kind: "idle" as const };

  // Re-quote on coupon OR pincode change (but only when at least one
  // is set — no point quoting an empty cart of inputs).
  useEffect(() => {
    if (!validCoupon) return;
    if (!validPincode && !couponCode) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await previewCheckoutTotals({ couponCode, pincode });
      if (cancelled) return;
      if (!result.success) {
        setPreview({
          couponCode,
          pincode,
          data: { kind: "error", message: result.error },
        });
        return;
      }
      const d = result.data;
      if (!d) return;
      setPreview({
        couponCode,
        pincode,
        data: {
          kind: "ok",
          subtotalPaise: d.subtotalPaise,
          discountPaise: d.discountPaise,
          shippingPaise: d.shippingPaise,
          totalPaise: d.totalPaise,
          couponApplied: d.couponApplied,
          couponReason: d.couponReason,
          shippingCourier: d.shippingCourier,
          shippingEtd: d.shippingEtd,
          shippingUnserviceable: d.shippingUnserviceable,
        },
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [couponCode, pincode, validCoupon, validPincode]);

  // Derived display values + button gating.
  const ok = previewState.kind === "ok" ? previewState : null;
  const shippingPaise = ok?.shippingPaise ?? 0;
  const discountPaise = ok?.discountPaise ?? 0;
  const totalPaise =
    ok?.totalPaise ?? Math.max(0, subtotalPaise + shippingPaise - discountPaise);

  // Block Pay when something we can actually see is wrong. Name + phone
  // are enforced by the browser's required-attribute and the server's
  // zod schema on submit, so we don't gate on them here — controlled
  // inputs would break browser autofill (no onChange fires, state stays
  // empty, button stays grey even though the field is visibly filled).
  const unserviceable = Boolean(ok?.shippingUnserviceable);
  const couponInvalid = Boolean(ok?.couponReason);
  const blockedReason = !validPincode
    ? "Enter a 6-digit shipping pincode."
    : previewState.kind === "loading"
      ? "Computing your total…"
      : unserviceable
        ? "No couriers serve this pincode."
        : couponInvalid
          ? ok?.couponReason ?? "Coupon is not valid."
          : previewState.kind === "error"
            ? previewState.message
            : null;

  const handleSubmit = (formData: FormData) => {
    // Field-level validation BEFORE we hand off to the server. Sets
    // inline errors keyed by field name. Native browser popovers are
    // suppressed via noValidate on the <form>.
    const fullName = (formData.get("fullName")?.toString() ?? "").trim();
    const phone = (formData.get("phone")?.toString() ?? "").trim();
    const errs: { fullName?: string; phone?: string } = {};
    if (fullName.length < 2) errs.fullName = "Enter your full name.";
    if (!/^[6-9][0-9]{9}$/.test(phone))
      errs.phone = "Enter a 10-digit Indian mobile number starting with 6-9.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    startTransition(async () => {
      if (!scriptReady || !window.Razorpay) {
        toast.error("Payment library still loading. Try again in a second.");
        return;
      }
      if (blockedReason) {
        toast.error(blockedReason);
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

      setPaying(true);

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
              // Don't log the Razorpay response (payment_id/order_id/
              // signature) to the browser console in production (#113).
              if (process.env.NODE_ENV !== "production") {
                console.error("[checkout] verify failed:", verifyResult.error, response);
              }
              toast.error(verifyResult.error);
              setPaying(false);
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
            // Customer closed the modal without paying. Best-effort
            // cleanup of the pending_payment row so it doesn't
            // accumulate.
            void cancelPendingOrder({ orderId: order.orderId });
            setPaying(false);
            toast.message("Payment cancelled. Try again when you're ready.");
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
        <form action={handleSubmit} noValidate>
          <Stack gap={4}>
            <div>
              <FormField
                label="Coupon code"
                description="student10 or teacher10. Vendor codes also accepted. Codes apply on this website only — Amazon orders aren't eligible."
              >
                <Input
                  name="couponCode"
                  placeholder="e.g. student10"
                  autoComplete="off"
                  maxLength={40}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.trim())}
                />
              </FormField>
              {ok?.couponApplied ? (
                <p className="text-caption text-success mt-1">
                  Code {ok.couponApplied} applied — −{formatINR(discountPaise)} off your books.
                </p>
              ) : ok?.couponReason ? (
                <p className="text-caption text-destructive mt-1">
                  {ok.couponReason}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-eyebrow mb-3">Shipping address</p>
              <Stack gap={3}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FormField label="Full name *">
                      <Input
                        name="fullName"
                        autoComplete="name"
                        placeholder="Your name"
                        maxLength={120}
                        aria-invalid={Boolean(fieldErrors.fullName)}
                        onInput={() =>
                          fieldErrors.fullName &&
                          setFieldErrors((e) => ({ ...e, fullName: undefined }))
                        }
                      />
                    </FormField>
                    {fieldErrors.fullName ? (
                      <p className="text-caption text-destructive mt-1">
                        {fieldErrors.fullName}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <FormField label="Phone (10-digit) *">
                      <Input
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="9876543210"
                        maxLength={10}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        onInput={() =>
                          fieldErrors.phone &&
                          setFieldErrors((e) => ({ ...e, phone: undefined }))
                        }
                      />
                    </FormField>
                    {fieldErrors.phone ? (
                      <p className="text-caption text-destructive mt-1">
                        {fieldErrors.phone}
                      </p>
                    ) : null}
                  </div>
                </div>

                <FormField
                  label="Address line 1"
                  description="Optional for now. Searchable address with Google Places is coming (#94)."
                >
                  <Input
                    name="line1"
                    autoComplete="address-line1"
                    placeholder="Flat / House no., Building, Street"
                    maxLength={160}
                  />
                </FormField>

                <FormField label="Address line 2 (optional)">
                  <Input
                    name="line2"
                    autoComplete="address-line2"
                    placeholder="Landmark, Area"
                    maxLength={160}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    label="Pincode *"
                    description="Fills city + state automatically."
                  >
                    <div className="relative">
                      <Input
                        name="pincode"
                        inputMode="numeric"
                        pattern="[1-9][0-9]{5}"
                        placeholder="560001"
                        autoComplete="postal-code"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
                        required
                      />
                      {pincodeResolving ? (
                        <Loader2
                          className="size-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : null}
                    </div>
                  </FormField>
                  <FormField label="City">
                    <Input
                      name="city"
                      autoComplete="address-level2"
                      maxLength={80}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </FormField>
                  <FormField label="State">
                    <Input
                      name="state"
                      autoComplete="address-level1"
                      maxLength={80}
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                    />
                  </FormField>
                </div>
              </Stack>
            </div>

            <div className="border-t border-border pt-4">
              <Stack gap={2}>
                <Row align="center" justify="between">
                  <Label className="text-body text-muted-foreground">Subtotal</Label>
                  <span className="text-body tabular-nums">
                    {formatINR(subtotalPaise)}
                  </span>
                </Row>

                {discountPaise > 0 ? (
                  <Row align="center" justify="between">
                    <Label className="text-body text-muted-foreground">
                      Discount{ok?.couponApplied ? ` (${ok.couponApplied})` : ""}
                    </Label>
                    <span className="text-body tabular-nums text-success">
                      − {formatINR(discountPaise)}
                    </span>
                  </Row>
                ) : null}

                <Row align="center" justify="between">
                  <Label className="text-body text-muted-foreground">Shipping</Label>
                  <span className="text-body tabular-nums">
                    {previewState.kind === "loading" ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        Quoting…
                      </span>
                    ) : unserviceable ? (
                      <span className="text-destructive text-caption">
                        No couriers serve this pincode
                      </span>
                    ) : ok && ok.shippingPaise > 0 ? (
                      formatINR(ok.shippingPaise)
                    ) : !validPincode ? (
                      <span className="text-muted-foreground text-caption">
                        Enter pincode for quote
                      </span>
                    ) : (
                      formatINR(0)
                    )}
                  </span>
                </Row>

                {ok?.shippingCourier && ok.shippingPaise > 0 ? (
                  <p className="text-caption text-muted-foreground">
                    Via {ok.shippingCourier}
                    {ok.shippingEtd ? ` · ETA ${ok.shippingEtd}` : ""}
                  </p>
                ) : null}

                <Row
                  align="center"
                  justify="between"
                  className="border-t border-border pt-2 mt-1"
                >
                  <Label className="text-headline">Total</Label>
                  <span className="text-headline tabular-nums">
                    {previewState.kind === "loading" ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-body">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        …
                      </span>
                    ) : (
                      formatINR(totalPaise)
                    )}
                  </span>
                </Row>
                <p className="text-caption text-muted-foreground">
                  This is what you&apos;ll pay on the Razorpay screen.
                </p>
              </Stack>
            </div>

            {paying ? (
              <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-caption">
                Payment in progress — don&apos;t close this window. We&apos;ll redirect you when it&apos;s done.
              </div>
            ) : null}

            {/* No-refund acknowledgement. Required before Pay enables.
                Disclosed in /legal/returns; this checkbox is the
                explicit consent for that policy (Consumer Protection
                Act 2019 expects opt-in for waiver-style clauses). */}
            <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 cursor-pointer">
              <Checkbox
                checked={acknowledgedNoRefund}
                onCheckedChange={(c) => setAcknowledgedNoRefund(Boolean(c))}
              />
              <span className="text-caption leading-relaxed">
                I understand <strong>all sales are final</strong> — Advaita
                does not offer returns or refunds. If a book arrives damaged
                in transit, send a photo within 7 days for a free replacement.
                Full policy: <a href="/legal/returns" target="_blank" className="underline">/legal/returns</a>.
              </span>
            </label>

            <Button
              type="submit"
              size="md"
              disabled={
                pending ||
                paying ||
                !scriptReady ||
                Boolean(blockedReason) ||
                !acknowledgedNoRefund
              }
              className="w-full"
            >
              {pending || paying ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {paying ? "Waiting for payment…" : "Opening Razorpay…"}
                </>
              ) : (
                "Pay with Razorpay"
              )}
            </Button>

            {blockedReason && !pending && !paying ? (
              <p className="text-caption text-muted-foreground text-center">
                {blockedReason}
              </p>
            ) : null}
          </Stack>
        </form>
      </Card>
    </>
  );
}
