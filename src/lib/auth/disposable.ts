/**
 * Disposable / throwaway email blocklist. Three layers, evaluated in order:
 *
 *   1. Canonical set — backed by the open-source `disposable-email-domains`
 *      package (~10k known domains).
 *   2. Curated extras — domains the canonical list misses but real
 *      throwaway services use. Updated by hand as new offenders surface.
 *   3. Pattern fallback — substring + RegExp match on common throwaway
 *      tokens (`tempmail`, `temomail`, `throwaway`, etc.) to catch
 *      variants and typos.
 *
 * Phase 2 decision: customer data is the goldmine, so signups with
 * throwaway addresses get rejected at the signup boundary before
 * Supabase Auth ever sees them.
 */

import disposableList from "disposable-email-domains";

const canonical = new Set<string>(disposableList);

/**
 * Curated extras — commercial-looking domains that aren't in the
 * canonical 10k list but are confirmed throwaway services. Add as
 * users report bypasses (see Issue #6 history).
 *
 * Add only after confirming the domain is actually disposable —
 * false positives here lock out real customers.
 */
const CURATED_EXTRAS = new Set<string>([
  // Reported via Issue #6 (2026-05-26)
  "westecom.com",
  "nepip.com",
  "iconpln.web.id",
  // Common commercial-looking throwaway services
  "dropmail.me",
  "mohmal.com",
  "emailondeck.com",
  "mailcatch.com",
  "moakt.com",
  "spam4.me",
  "burnermail.io",
  "minutemail.com",
  "anonbox.net",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "einrot.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
]);

// Patterns that catch common variants the lists may miss.
const PATTERN_FALLBACK: RegExp[] = [
  /tempmail/i,
  /temp-mail/i,
  /temomail/i,
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
  /burnermail/i,
];

export function isDisposableEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (canonical.has(domain)) return true;
  if (CURATED_EXTRAS.has(domain)) return true;
  return PATTERN_FALLBACK.some((p) => p.test(domain));
}
