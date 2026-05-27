import "server-only";

import Razorpay from "razorpay";
import { env } from "@/lib/env";

/**
 * Server-only Razorpay SDK instance. NEVER import from a client module
 * (the secret would ship to the browser).
 *
 * Lazily instantiated — first call validates the keys are present.
 * Throws a clear error if they're not, so /checkout's createRazorpayOrder
 * fails loudly instead of producing a silent "undefined" payload.
 */

let _client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (_client) return _client;

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay keys are missing. Paste RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET into .env.local and restart `pnpm dev`. See SETUP-PHASE-3.md.",
    );
  }

  _client = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return _client;
}

/**
 * Public-safe view of the Razorpay key id. The Checkout JS modal needs
 * the key_id in the browser, but never the secret. Use this exported
 * helper instead of reading env directly from client code.
 */
export function getPublicRazorpayKeyId(): string | null {
  return env.RAZORPAY_KEY_ID ?? null;
}
