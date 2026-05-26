/**
 * Disposable / throwaway email blocklist. Backed by the open-source
 * `disposable-email-domains` package (~10k known domains: mailinator,
 * tempmail, guerrillamail, 10minutemail, etc.).
 *
 * Phase 2 decision: customer data is the goldmine, so signups with
 * throwaway addresses get rejected at the signup boundary before
 * Supabase Auth ever sees them.
 */

import disposableList from "disposable-email-domains";

// Set lookup is O(1); the package ships as a string[].
const blocklist = new Set<string>(disposableList);

export function isDisposableEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return blocklist.has(domain);
}
