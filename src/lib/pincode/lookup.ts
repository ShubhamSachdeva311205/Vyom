import "server-only";
import data from "./pincodes.json";

/**
 * Offline pincode → city/state resolver.
 *
 * Backed by `pincodes.json` — a compact map of every Indian PIN code to
 * its district + state, derived once from the GeoNames India postal
 * dataset (public domain, CC-BY). ~19k entries, ~660KB, loaded only on
 * the server. Zero network calls at request time, zero third-party
 * dependency. Refresh the file by re-running scripts/build-pincodes.mjs
 * if India Post ever adds new codes.
 */

const MAP = data as Record<string, string[]>;

export interface PincodeResolved {
  city: string;
  state: string;
  country: string;
}

export function resolvePincode(pincode: string): PincodeResolved | null {
  const hit = MAP[pincode];
  if (!hit || hit.length < 2) return null;
  return { city: hit[0], state: hit[1], country: "India" };
}
