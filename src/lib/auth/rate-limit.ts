import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort in-process rate limiter (#110). A fixed-window counter keyed by
 * (action, client-IP). This is the interim defense until Cloudflare WAF rules
 * land in Phase 9 (CLAUDE.md §8) — it bounds brute-force / spray / email-bomb
 * abuse on auth + coupon endpoints within a single server instance.
 *
 * Caveat: serverless instances don't share memory, so a distributed attacker
 * hitting many cold instances can still get more than `limit` attempts. That's
 * acceptable for an interim control; the edge WAF is the real per-IP limiter.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded.
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Returns { ok: true } if the call is allowed, or { ok: false, retryAfter }
 * (seconds) if the window limit is exceeded. Callers map a block to a generic
 * "too many attempts" message — never reveal the limit or remaining count.
 */
export async function rateLimit(
  action: string,
  opts: { limit: number; windowSec: number } = { limit: 10, windowSec: 60 },
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const now = Date.now();
  sweep(now);
  const ip = await clientIp();
  const key = `${action}:${ip}`;
  const windowMs = opts.windowSec * 1000;

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (existing.count >= opts.limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true };
}

/** Standard user-facing copy for a throttled auth/coupon action. */
export const TOO_MANY_ATTEMPTS =
  "Too many attempts. Please wait a minute and try again.";
