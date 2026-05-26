/**
 * Disposable / throwaway email blocklist. Two layers:
 *
 *   1. Canonical set — backed by the open-source `disposable-email-domains`
 *      package (~10k known domains).
 *   2. Pattern fallback — substring match on common throwaway tokens
 *      (`tempmail`, `temomail`, `throwaway`, etc.) to catch variants and
 *      typos that the canonical list misses (e.g. temomail.org).
 *
 * Phase 2 decision: customer data is the goldmine, so signups with
 * throwaway addresses get rejected at the signup boundary before
 * Supabase Auth ever sees them.
 */

import disposableList from "disposable-email-domains";

const blocklist = new Set<string>(disposableList);

// Patterns that catch common variants the canonical list may miss.
// Match against the domain portion, case-insensitive.
const PATTERN_FALLBACK: RegExp[] = [
  /tempmail/i,
  /temp-mail/i,
  /temomail/i, // user-reported variant
  /throwaway/i,
  /trashmail/i,
  /mailinator/i,
  /guerrillamail/i,
  /yopmail/i,
  /10minutemail/i,
  /sharklasers/i,
  /fakeinbox/i,
  /maildrop/i,
  /getnada/i,
  /dispostable/i,
  /\bdisposable\b/i,
];

export function isDisposableEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (blocklist.has(domain)) return true;
  return PATTERN_FALLBACK.some((p) => p.test(domain));
}
