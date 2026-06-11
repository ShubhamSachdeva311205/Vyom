"use server";

/**
 * Pincode → city / state lookup (#117). Backed by an OFFLINE dataset
 * (src/lib/pincode/pincodes.json), not a third-party API — so there's
 * no network round-trip at checkout, no external dependency that can be
 * down or rate-limited, and nothing leaves our server. See the data
 * note in src/lib/pincode/lookup.ts.
 *
 * Manual entry always remains possible; this is a convenience, not a
 * gate. Returns success:false for an unknown pincode so the form can
 * leave City/State for the customer to type.
 */

import { resolvePincode } from "@/lib/pincode/lookup";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PincodeInfo {
  city: string;
  state: string;
  country: string;
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;

export async function lookupPincode(pincode: string): Promise<ActionResult<PincodeInfo>> {
  if (!PINCODE_RE.test(pincode)) {
    return { success: false, error: "Enter a valid 6-digit pincode." };
  }
  const hit = resolvePincode(pincode);
  if (!hit) return { success: false, error: "Pincode not found." };
  return { success: true, data: hit };
}
