"use server";

/**
 * Checkout Server Actions — Phase 3.1.
 *
 * Two actions:
 *   - createRazorpayOrder({ couponCode?, pincode? })
 *       Validates the signed-in user has a non-empty cart, optionally
 *       redeems a coupon (atomic via redeem_coupon RPC), inserts a
 *       pending_payment order + order_items snapshot, creates a
 *       Razorpay order via SDK, returns the ids the Checkout JS modal
 *       needs.
 *   - verifyPaymentAndCompleteOrder({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
 *       Constant-time HMAC verify, flips our order to 'paid', stamps
 *       the payment id, returns our order id so the client can
 *       redirect to /order/[id]/success.
 *
 * Both follow CLAUDE.md §4: discriminated-union return shape, no
 * throws on user-facing paths.
 *
 * Shipping is hard-coded to ₹0 here. Phase 3.3 wires Shiprocket and
 * settings.free_shipping_enabled. GST stays ₹0 until Phase 3.5.
 */

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { findCartForOwner, getCartWithItems, resolveCartOwner } from "@/lib/cart/queries";
import { sendOrderConfirmation } from "@/lib/email/order-confirmation";
import { env } from "@/lib/env";
import { formatINR as formatINRForPreview } from "@/lib/format";
import { getRazorpayClient } from "@/lib/razorpay/client";
import {
  applyFreeShippingRule,
  getCheckoutSafety,
  getShippingSettings,
} from "@/lib/settings/queries";
import {
  ShiprocketError,
  getServiceability,
} from "@/lib/shiprocket/client";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const COUPON_REGEX = /^[A-Za-z0-9-_]{3,40}$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/; // Indian mobile, 10 digits

// Circuit breaker — minimum fraction of subtotal that the customer
// must actually pay. Read from settings.checkout_safety so Mom can
// adjust per Phase 5.5 UI. Default 0.30.

// Shipping address. Hard-required for now: name + phone + pincode.
// Street fields are kept in the form (Shiprocket / invoice still need
// them eventually) but accepted as empty so users can complete a test
// or one-off checkout without filling everything. We'll re-tighten
// once Google Places autocomplete lands (#94).
const shippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Enter a 10-digit Indian mobile number"),
  line1: z.string().trim().max(160).optional().or(z.literal("")),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: z.string().regex(PINCODE_REGEX, "Pincode must be 6 digits"),
});

export type ShippingAddressInput = z.input<typeof shippingAddressSchema>;

const createOrderInput = z.object({
  couponCode: z.string().regex(COUPON_REGEX).optional().or(z.literal("")),
  shippingAddress: shippingAddressSchema,
});

const verifyInput = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Preview only needs pincode for the live quote — full address goes
// via createRazorpayOrder once the customer commits.
const previewInput = z.object({
  couponCode: z.string().regex(COUPON_REGEX).optional().or(z.literal("")),
  pincode: z.string().regex(PINCODE_REGEX).optional().or(z.literal("")),
});

const cancelInput = z.object({
  orderId: z.string().uuid(),
});

/* -----------------------------------------------------------------
 * Helpers shared by the verify + webhook paths
 * ----------------------------------------------------------------- */
async function decrementInventoryAfterPayment(orderId: string): Promise<void> {
  const service = createServiceClient();
  type RpcRow = { ok: boolean; reason: string };
  const { data, error } = await service.rpc(
    "decrement_inventory" as never,
    { p_order_id: orderId } as never,
  );
  if (error) {
    console.error("[checkout] decrement_inventory threw:", error);
    return;
  }
  const row = (Array.isArray(data) ? data[0] : data) as RpcRow | null;
  if (!row || row.ok || row.reason === "already_done") return;

  console.error("[checkout] inventory decrement failed for paid order:", {
    orderId,
    reason: row.reason,
  });
  await service
    .from("orders")
    .update({
      admin_notes:
        `STOCK ISSUE on payment: decrement_inventory returned "${row.reason}". ` +
        "Manual refund + restock required.",
    } as never)
    .eq("id", orderId);
}

/**
 * Grant digital access (audio / answer-key PDF) for every book in a
 * paid order that has companions. Idempotent via the RPC's stamp.
 */
async function grantDigitalAccessAfterPayment(orderId: string): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.rpc(
    "grant_digital_access" as never,
    { p_order_id: orderId } as never,
  );
  if (error) {
    console.error("[checkout] grant_digital_access threw:", error);
  }
}

/* -----------------------------------------------------------------
 * previewCheckoutTotals — read-only breakdown for the live UI.
 *
 * Mirrors the math inside createRazorpayOrder but inserts nothing
 * and redeems nothing. The actual order create rebuilds these
 * numbers server-side so a tampered client can't underpay.
 * ----------------------------------------------------------------- */
export interface CheckoutPreview {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  totalPaise: number;
  couponApplied: string | null;
  couponReason: string | null;
  shippingCourier: string | null;
  shippingEtd: string | null;
  shippingUnserviceable: boolean;
}

export async function previewCheckoutTotals(
  input: z.input<typeof previewInput>,
): Promise<ActionResult<CheckoutPreview>> {
  const parsed = previewInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Coupon or pincode format looks invalid." };
  }

  const couponCode = parsed.data.couponCode || null;
  const pincode = parsed.data.pincode || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please sign in to check out." };
  }

  const owner = await resolveCartOwner();
  if (!owner || owner.kind !== "user" || owner.userId !== user.id) {
    return { success: false, error: "Could not find your cart." };
  }
  const cart = await findCartForOwner(owner);
  if (!cart) return { success: false, error: "Your cart is empty." };
  const cartWithItems = await getCartWithItems(cart.id);
  if (!cartWithItems || cartWithItems.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  const subtotalPaise = cartWithItems.items.reduce(
    (sum, it) => sum + it.book.price_paise * it.quantity,
    0,
  );
  const eligibleSubtotalPaise = cartWithItems.items.reduce(
    (sum, it) =>
      sum + (it.book.discount_eligible ? it.book.price_paise * it.quantity : 0),
    0,
  );

  // Coupon preview (read-only — never redeems).
  const service = createServiceClient();
  let discountPaise = 0;
  let couponApplied: string | null = null;
  let couponReason: string | null = null;
  if (couponCode) {
    // Book-targeted coupons discount only their book's subtotal (#clearance).
    const { data: scoped } = await service
      .from("coupons")
      .select("book_id")
      .eq("code", couponCode)
      .maybeSingle();
    const scopedBookId = (scoped as { book_id: string | null } | null)?.book_id ?? null;
    const couponEligible = scopedBookId
      ? cartWithItems.items.reduce(
          (s, it) => s + (it.book.id === scopedBookId ? it.book.price_paise * it.quantity : 0),
          0,
        )
      : eligibleSubtotalPaise;
    const { data: preview } = await service.rpc("preview_coupon", {
      p_code: couponCode,
      p_user_id: user.id,
      p_eligible_subtotal_paise: couponEligible,
    });
    const row = Array.isArray(preview) ? preview[0] : preview;
    if (row?.valid) {
      discountPaise = row.discount_paise ?? 0;
      couponApplied = couponCode;
    } else {
      couponReason = row?.reason ?? "Coupon is not valid.";
    }
  }

  // Shipping quote.
  let shippingPaise = 0;
  let shippingCourier: string | null = null;
  let shippingEtd: string | null = null;
  let shippingUnserviceable = false;
  if (pincode) {
    const weightGrams = cartWithItems.items.reduce((sum, it) => {
      const w = (it.book as unknown as { weight_grams?: number }).weight_grams ?? 300;
      return sum + w * it.quantity;
    }, 0);
    try {
      const shippingSettings = await getShippingSettings();
      const { cheapest } = await getServiceability({
        deliveryPincode: pincode,
        weightGrams,
        pickupPincode: shippingSettings.pickupPincode,
      });
      if (cheapest) {
        const rawPaise = Math.round(cheapest.rate * 100);
        const { ratePaise, freeApplied } = applyFreeShippingRule(
          rawPaise,
          shippingSettings,
        );
        shippingPaise = ratePaise;
        shippingCourier = freeApplied
          ? `Free (saved ${formatINRForPreview(rawPaise)})`
          : cheapest.courier_name;
        shippingEtd = cheapest.etd;
      } else {
        shippingUnserviceable = true;
      }
    } catch (err) {
      console.error(
        "[previewCheckoutTotals] Shiprocket quote failed:",
        err instanceof ShiprocketError ? err.message : err,
      );
    }
  }

  const totalPaise = Math.max(
    0,
    subtotalPaise - discountPaise + shippingPaise,
  );

  return {
    success: true,
    data: {
      subtotalPaise,
      discountPaise,
      shippingPaise,
      totalPaise,
      couponApplied,
      couponReason,
      shippingCourier,
      shippingEtd,
      shippingUnserviceable,
    },
  };
}

/* -----------------------------------------------------------------
 * cancelPendingOrder — mark a pending_payment order as cancelled.
 *
 * Called by the Razorpay modal's `ondismiss` handler so abandoned
 * checkouts get cleaned up immediately instead of accumulating in
 * the DB. Only the owner of the order can cancel it; only
 * `pending_payment` rows are eligible (paid orders are immutable
 * via this path — admin reversal is its own action).
 * ----------------------------------------------------------------- */
export async function cancelPendingOrder(
  input: z.input<typeof cancelInput>,
): Promise<ActionResult> {
  const parsed = cancelInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid order id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const service = createServiceClient();
  const { data: existing } = await service
    .from("orders")
    .select("id, user_id, status")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (!existing || existing.user_id !== user.id) {
    return { success: false, error: "Order not found." };
  }
  if (existing.status !== "pending_payment") {
    // Already moved past pending — nothing to do, but not a real error.
    return { success: true };
  }

  const { error } = await service
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.orderId);
  if (error) {
    console.error("[checkout] cancelPendingOrder failed:", error.message);
    return { success: false, error: "Could not cancel the order. Please try again." };
  }
  return { success: true };
}

export interface CreatedOrderPayload {
  /** Our internal orders.id — used for success-page redirect. */
  orderId: string;
  /** Order number (ADV-YYYYMMDD-XXXXX) — shown on receipt. */
  orderNumber: string;
  /** Razorpay-side order id (order_XXXX) — the Checkout JS modal needs this. */
  razorpayOrderId: string;
  /** Amount in paise as Razorpay sees it. */
  amountPaise: number;
  /** ISO currency. Always "INR" for us. */
  currency: string;
  /** Razorpay public key id for the Checkout modal. */
  razorpayKeyId: string;
  /** Computed breakdown for client-side display. */
  breakdown: {
    subtotalPaise: number;
    discountPaise: number;
    shippingPaise: number;
    taxPaise: number;
    totalPaise: number;
    couponApplied: string | null;
  };
}

/* -----------------------------------------------------------------
 * createRazorpayOrder
 * ----------------------------------------------------------------- */
export async function createRazorpayOrder(
  formData: FormData,
): Promise<ActionResult<CreatedOrderPayload>> {
  const parsed = createOrderInput.safeParse({
    couponCode: formData.get("couponCode")?.toString().trim() || "",
    shippingAddress: {
      fullName: formData.get("fullName")?.toString().trim() ?? "",
      phone: formData.get("phone")?.toString().trim() ?? "",
      line1: formData.get("line1")?.toString().trim() ?? "",
      line2: formData.get("line2")?.toString().trim() ?? "",
      city: formData.get("city")?.toString().trim() ?? "",
      state: formData.get("state")?.toString().trim() ?? "",
      pincode: formData.get("pincode")?.toString().trim() ?? "",
    },
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message ?? "Please fill in all shipping details.",
    };
  }

  const couponCode = parsed.data.couponCode || null;
  const address = parsed.data.shippingAddress;
  const pincode = address.pincode;

  // 1. Require signed-in user (FFR §A6: guest checkout NOT supported).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please sign in to check out." };
  }

  // 2. Resolve cart + items.
  const owner = await resolveCartOwner();
  if (!owner || owner.kind !== "user" || owner.userId !== user.id) {
    return { success: false, error: "Could not find your cart." };
  }
  const cart = await findCartForOwner(owner);
  if (!cart) return { success: false, error: "Your cart is empty." };

  const cartWithItems = await getCartWithItems(cart.id);
  if (!cartWithItems || cartWithItems.items.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  // 3. Compute totals.
  const subtotalPaise = cartWithItems.items.reduce(
    (sum, it) => sum + it.book.price_paise * it.quantity,
    0,
  );
  const eligibleSubtotalPaise = cartWithItems.items.reduce(
    (sum, it) =>
      sum + (it.book.discount_eligible ? it.book.price_paise * it.quantity : 0),
    0,
  );

  // Re-fetch a Shiprocket quote server-side so a tampered client price
  // can't override the real cost. Fall back to 0 (free shipping) if
  // pincode is missing or Shiprocket is down — checkout still works,
  // Mom absorbs the cost in those rare cases.
  let shippingPaise = 0;
  if (pincode) {
    const weightGrams = cartWithItems.items.reduce((sum, it) => {
      const w = (it.book as unknown as { weight_grams?: number }).weight_grams ?? 300;
      return sum + w * it.quantity;
    }, 0);
    try {
      const shippingSettings = await getShippingSettings();
      const { cheapest } = await getServiceability({
        deliveryPincode: pincode,
        weightGrams,
        pickupPincode: shippingSettings.pickupPincode,
      });
      if (cheapest) {
        const rawPaise = Math.round(cheapest.rate * 100);
        shippingPaise = applyFreeShippingRule(rawPaise, shippingSettings).ratePaise;
      }
    } catch (err) {
      // Log + degrade gracefully. Don't fail checkout because of a
      // courier-API hiccup.
      console.error(
        "[checkout] Shiprocket quote failed — defaulting shipping to ₹0:",
        err instanceof ShiprocketError ? err.message : err,
      );
    }
  }
  const taxPaise = 0; // Phase 3.5 will compute GST.

  // 4. Insert pending order WITHOUT coupon first so we have order_id for
  //    the atomic redeem_coupon call. discount_paise gets patched after.
  const service = createServiceClient();
  const orderNumber = generateOrderNumber();

  // Shape stored in orders.shipping_address (jsonb). Matches the
  // ShipAddress type consumed by autoCreateShiprocketOrder and the
  // invoice renderer's Ship To block.
  const shippingAddressJson = {
    name: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: "India",
  };

  const { data: orderRow, error: orderErr } = await service
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: "pending_payment",
      subtotal_paise: subtotalPaise,
      discount_paise: 0,
      shipping_paise: shippingPaise,
      tax_paise: taxPaise,
      total_paise: subtotalPaise + shippingPaise + taxPaise,
      shipping_pincode: pincode,
      shipping_address: shippingAddressJson,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !orderRow) {
    return { success: false, error: "Could not open an order. Try again." };
  }

  // 4b. Remember this address on the profile for next-time pre-fill (#93)
  //     when the customer ticked "save". Best-effort — never blocks checkout.
  if (formData.get("saveAddress")?.toString() === "on") {
    await service
      .from("users")
      .update({ default_shipping_address: shippingAddressJson } as never)
      .eq("id", user.id);
  }

  // 5. Snapshot order items.
  const itemRows = cartWithItems.items.map((it) => ({
    order_id: orderRow.id,
    book_id: it.book.id,
    quantity: it.quantity,
    unit_price_paise: it.book.price_paise,
  }));
  const { error: itemsErr } = await service.from("order_items").insert(itemRows);
  if (itemsErr) {
    await service.from("orders").delete().eq("id", orderRow.id);
    return { success: false, error: "Could not snapshot cart items." };
  }

  // 6. PREVIEW coupon (read-only). We don't redeem yet — that happens
  //    in verifyPaymentAndCompleteOrder so coupons don't count as used
  //    if the customer closes the modal or payment fails. (Issue #78.)
  let discountPaise = 0;
  let couponApplied: string | null = null;
  if (couponCode) {
    // Book-targeted coupons discount only their book's subtotal (#clearance).
    const { data: scopedC } = await service
      .from("coupons")
      .select("book_id")
      .eq("code", couponCode)
      .maybeSingle();
    const scopedBookId = (scopedC as { book_id: string | null } | null)?.book_id ?? null;
    const couponEligible = scopedBookId
      ? cartWithItems.items.reduce(
          (s, it) => s + (it.book.id === scopedBookId ? it.book.price_paise * it.quantity : 0),
          0,
        )
      : eligibleSubtotalPaise;
    const { data: preview, error: previewErr } = await service.rpc("preview_coupon", {
      p_code: couponCode,
      p_user_id: user.id,
      p_eligible_subtotal_paise: couponEligible,
    });
    if (previewErr) {
      await service.from("orders").delete().eq("id", orderRow.id);
      return { success: false, error: "Could not validate coupon. Try again." };
    }
    const row = Array.isArray(preview) ? preview[0] : preview;
    if (!row?.valid) {
      await service.from("orders").delete().eq("id", orderRow.id);
      return { success: false, error: row?.reason ?? "Coupon is not valid." };
    }
    discountPaise = row.discount_paise ?? 0;
    couponApplied = couponCode;
  }

  // 7. Patch order with discount + final total + coupon code (so the
  //    post-payment redeem knows which code to honour).
  const totalPaise = Math.max(0, subtotalPaise - discountPaise + shippingPaise + taxPaise);

  // 7a. Circuit breaker — refuse to send a Razorpay order whose total
  //     is implausibly low against the cart subtotal. Belt-and-suspenders
  //     on top of the server-side price computation. Logs full detail
  //     for forensics if it ever fires.
  const checkoutSafety = await getCheckoutSafety();
  const minPayablePaise = Math.floor(
    subtotalPaise * checkoutSafety.minPayableFraction,
  );
  if (subtotalPaise > 0 && totalPaise < minPayablePaise) {
    console.error("[checkout] PRICE FLOOR TRIGGERED — refusing to create Razorpay order", {
      orderId: orderRow.id,
      orderNumber: orderRow.order_number,
      userId: user.id,
      subtotalPaise,
      discountPaise,
      shippingPaise,
      taxPaise,
      totalPaise,
      minPayablePaise,
      minPayableFraction: checkoutSafety.minPayableFraction,
      couponApplied,
    });
    await service.from("orders").delete().eq("id", orderRow.id);
    return {
      success: false,
      error:
        "Something looks wrong with the total on this order. Please refresh and try again — if it keeps happening, email shubhamhelpseries@gmail.com.",
    };
  }

  await service
    .from("orders")
    .update({
      discount_paise: discountPaise,
      total_paise: totalPaise,
      coupon_code: couponApplied,
    })
    .eq("id", orderRow.id);

  // 8. Create Razorpay order. Receipt field gets our order_number.
  let rzpOrder;
  try {
    const razorpay = getRazorpayClient();
    rzpOrder = await razorpay.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: orderRow.order_number,
      notes: { dbOrderId: orderRow.id, userId: user.id },
    });
  } catch {
    await service.from("orders").delete().eq("id", orderRow.id);
    return { success: false, error: "Razorpay refused the order. Try again." };
  }

  // 9. Stamp the razorpay_order_id on our row.
  await service
    .from("orders")
    .update({ razorpay_order_id: rzpOrder.id })
    .eq("id", orderRow.id);

  return {
    success: true,
    data: {
      orderId: orderRow.id,
      orderNumber: orderRow.order_number,
      razorpayOrderId: rzpOrder.id,
      amountPaise: totalPaise,
      currency: "INR",
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? "",
      breakdown: {
        subtotalPaise,
        discountPaise,
        shippingPaise,
        taxPaise,
        totalPaise,
        couponApplied,
      },
    },
  };
}

/* -----------------------------------------------------------------
 * verifyPaymentAndCompleteOrder
 * ----------------------------------------------------------------- */
export async function verifyPaymentAndCompleteOrder(
  input: z.infer<typeof verifyInput>,
): Promise<ActionResult<{ orderId: string }>> {
  const parsed = verifyInput.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid payment payload." };
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!env.RAZORPAY_KEY_SECRET) {
    return { success: false, error: "Razorpay secret missing on server." };
  }

  // Constant-time HMAC verify per Razorpay docs: SHA256(order_id|payment_id, secret).
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const sigOk = safeEqualHex(expected, razorpay_signature);
  if (!sigOk) {
    return { success: false, error: "Payment signature did not verify." };
  }

  // Find our order by razorpay_order_id (service-role: we only trust the
  // verified signature above to authorize the flip).
  const service = createServiceClient();
  const { data: order, error: orderErr } = await service
    .from("orders")
    .select("id, status, user_id, coupon_code, subtotal_paise")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();

  if (orderErr || !order) {
    return { success: false, error: "Order not found." };
  }

  // Verify the signed-in user owns this order — defense in depth.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== order.user_id) {
    return { success: false, error: "Order does not belong to you." };
  }

  // Idempotent: if already paid (e.g. webhook beat us here), short-circuit
  // the status flip — but still attempt inventory decrement below (the
  // RPC has its own idempotency stamp).
  if (order.status === "pending_payment") {
    const { error: updErr } = await service
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updErr) {
      return { success: false, error: "Could not finalise the order." };
    }
  }

  // Atomic inventory decrement (idempotent). Failures are logged + the
  // order is flagged for admin attention; we don't fail the user-facing
  // path because the money has already cleared.
  await decrementInventoryAfterPayment(order.id);
  await grantDigitalAccessAfterPayment(order.id);

  // NOW redeem the coupon — only after payment succeeded. If the
  // redeem fails (e.g. someone else used a single-use vendor code in
  // the gap), log to the order's notes for admin reconciliation but
  // don't fail the customer's transaction.
  if (order.coupon_code) {
    // Compute the eligible subtotal we previewed against — recompute
    // from the snapshot in order_items + books to stay honest. For
    // now we just pass the order's full subtotal_paise; if eligibility
    // mattered (some books not eligible) the discount was already
    // applied at preview time so this re-check will match.
    //
    // Idempotency: the webhook path also redeems (#78). Skip if a
    // redemption already exists for this order so the two paths can't
    // double-count the code.
    const { data: existingRedemption } = await service
      .from("coupon_redemptions")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();
    const { data: redeem, error: redeemErr } = existingRedemption
      ? { data: [{ success: true, reason: "already_done" }], error: null }
      : await service.rpc("redeem_coupon", {
          p_code: order.coupon_code,
          p_user_id: order.user_id,
          p_order_id: order.id,
          p_eligible_subtotal_paise: order.subtotal_paise,
        });
    const row = Array.isArray(redeem) ? redeem[0] : redeem;
    if (redeemErr || !row?.success) {
      await service
        .from("orders")
        .update({
          notes: `Post-payment coupon redeem failed: ${row?.reason ?? redeemErr?.message ?? "unknown"}`,
        })
        .eq("id", order.id);
    }
  }

  // Order-confirmation email (idempotent + non-throwing; the webhook path
  // may also call it — whichever wins the atomic claim sends).
  await sendOrderConfirmation(order.id);

  // Clear the cart now that payment captured.
  const ownerCart = await findCartForOwner({ kind: "user", userId: user.id });
  if (ownerCart) {
    await service.from("cart_items").delete().eq("cart_id", ownerCart.id);
  }

  revalidatePath("/cart");
  revalidatePath("/dashboard");

  return { success: true, data: { orderId: order.id } };
}

/* -----------------------------------------------------------------
 * helpers
 * ----------------------------------------------------------------- */
function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  // 5 random base36 chars — collision-resistant enough at our volume,
  // and short enough to read aloud on a support call.
  const suffix = crypto.randomBytes(4).toString("base64url").slice(0, 5).toUpperCase();
  return `ADV-${y}${m}${d}-${suffix}`;
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
