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

  // Cloudflare is our front door (CLAUDE.md §8). It sets the true client IP
  // here and overwrites any client-supplied value, so it can't be spoofed.
  const cf = h.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();

  // Set by the upstream proxy to the real client IP.
  const real = h.get("x-real-ip");
  if (real?.trim()) return real.trim();

  // Last resort: X-Forwarded-For. The LEFTMOST entry is client-controlled and
  // trivially spoofable (an attacker prepends a fake IP to get a fresh bucket),
  // so trust the RIGHTMOST hop — the one appended by the proxy we actually sit
  // behind — instead of the leftmost.
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  return "unknown";
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
