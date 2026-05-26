/**
 * Pure formatters — safe to import from both server and client code.
 * Don't put anything here that pulls in next/headers or other RSC-only
 * dependencies.
 */

/** Format paise integer as ₹X,XXX for display. */
export function formatINR(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}
