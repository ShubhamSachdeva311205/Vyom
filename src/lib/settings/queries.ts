import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Typed read helpers for the `public.settings` key→jsonb table.
 *
 * Each getter is wrapped in React.cache() so repeated calls within a
 * single render pass hit the DB once. Every getter has a HARDCODED
 * fallback so consumers (checkout flow, invoice renderer) never crash
 * because a settings row is missing — they degrade to sensible
 * defaults instead.
 *
 * Mutations live in src/actions/admin-settings.ts and revalidate the
 * /admin/settings path on success.
 */

export interface SellerDetails {
  name: string;
  addressLines: string[];
  phone: string;
  email: string;
  gstin: string | null;
}

export interface ShippingSettings {
  freeShippingEnabled: boolean;
  freeShippingThresholdPaise: number;
  pickupPincode: string | null;
  pickupLocation: string;
}

export interface BankDetails {
  name: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export interface CheckoutSafety {
  /**
   * Minimum fraction of the cart subtotal that the customer must
   * actually pay. Refuses to send the Razorpay order otherwise.
   * Defends against an unknown bug or attacker producing a near-zero
   * total. Range: 0 (no floor) – 1.0 (must pay 100%).
   */
  minPayableFraction: number;
}

const DEFAULT_SELLER: SellerDetails = {
  name: "Seema Sachdeva",
  addressLines: ["Bengaluru, Karnataka", "India"],
  phone: "+91 99999 00000",
  email: "shubhamhelpseries@gmail.com",
  gstin: null,
};

const DEFAULT_SHIPPING: ShippingSettings = {
  freeShippingEnabled: true,
  freeShippingThresholdPaise: 10000,
  pickupPincode: null,
  pickupLocation: "Primary",
};

const DEFAULT_BANK: BankDetails = {
  name: "State Bank of India",
  accountNumber: "***REDACTED***",
  ifsc: "***REDACTED***",
  branch: "Marathahalli",
};

const DEFAULT_CHECKOUT_SAFETY: CheckoutSafety = {
  minPayableFraction: 0.3,
};

async function readSetting(key: string): Promise<unknown> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error || !data) return null;
  return data.value;
}

export const getSellerDetails = cache(async (): Promise<SellerDetails> => {
  const raw = (await readSetting("seller_details")) as Partial<{
    name: string;
    address_lines: string[];
    phone: string;
    email: string;
    gstin: string | null;
  }> | null;
  if (!raw) return DEFAULT_SELLER;
  return {
    name: raw.name ?? DEFAULT_SELLER.name,
    addressLines:
      Array.isArray(raw.address_lines) && raw.address_lines.length > 0
        ? raw.address_lines
        : DEFAULT_SELLER.addressLines,
    phone: raw.phone ?? DEFAULT_SELLER.phone,
    email: raw.email ?? DEFAULT_SELLER.email,
    gstin: raw.gstin ?? null,
  };
});

export const getShippingSettings = cache(async (): Promise<ShippingSettings> => {
  const raw = (await readSetting("shipping_settings")) as Partial<{
    free_shipping_enabled: boolean;
    free_shipping_threshold_paise: number;
    pickup_pincode: string | null;
    pickup_location: string;
  }> | null;
  // pickup_pincode env var still wins as the boot-time fallback so
  // the Phase 3.3 setup instructions stay valid.
  const envPincode = env.SHIPROCKET_PICKUP_PINCODE ?? null;
  if (!raw) {
    return { ...DEFAULT_SHIPPING, pickupPincode: envPincode };
  }
  return {
    freeShippingEnabled:
      raw.free_shipping_enabled ?? DEFAULT_SHIPPING.freeShippingEnabled,
    freeShippingThresholdPaise:
      raw.free_shipping_threshold_paise ?? DEFAULT_SHIPPING.freeShippingThresholdPaise,
    pickupPincode: raw.pickup_pincode ?? envPincode,
    pickupLocation: raw.pickup_location ?? env.SHIPROCKET_PICKUP_LOCATION,
  };
});

export const getCheckoutSafety = cache(async (): Promise<CheckoutSafety> => {
  const raw = (await readSetting("checkout_safety")) as Partial<{
    min_payable_fraction: number;
  }> | null;
  if (!raw) return DEFAULT_CHECKOUT_SAFETY;
  // Clamp to [0, 1] in case a bad value got into the row.
  const v = Number(raw.min_payable_fraction);
  const clamped = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_CHECKOUT_SAFETY.minPayableFraction;
  return { minPayableFraction: clamped };
});

export const getBankDetails = cache(async (): Promise<BankDetails> => {
  const raw = (await readSetting("bank_details")) as Partial<{
    name: string;
    account_number: string;
    ifsc: string;
    branch: string;
  }> | null;
  if (!raw) return DEFAULT_BANK;
  return {
    name: raw.name ?? DEFAULT_BANK.name,
    accountNumber: raw.account_number ?? DEFAULT_BANK.accountNumber,
    ifsc: raw.ifsc ?? DEFAULT_BANK.ifsc,
    branch: raw.branch ?? DEFAULT_BANK.branch,
  };
});

/**
 * Apply the "free if Shiprocket quote < threshold" rule. Pure helper
 * — caller passes the live quote, gets back the price to charge.
 */
export function applyFreeShippingRule(
  ratePaise: number,
  settings: ShippingSettings,
): { ratePaise: number; freeApplied: boolean } {
  if (!settings.freeShippingEnabled) {
    return { ratePaise, freeApplied: false };
  }
  if (ratePaise < settings.freeShippingThresholdPaise) {
    return { ratePaise: 0, freeApplied: true };
  }
  return { ratePaise, freeApplied: false };
}
