import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

/**
 * Anonymous cart session helpers.
 *
 * Before sign-in, a cart belongs to an `anonymous_session_id` stored in
 * an HttpOnly cookie. After sign-in, `mergeAnonymousCartIntoUserCart`
 * (in src/actions/cart.ts) re-attaches the anon cart's items to the
 * user's cart and the cookie is cleared.
 *
 * The cookie name is intentionally short + opaque. It carries no PII —
 * just a random UUID that scopes anonymous cart rows.
 */

const COOKIE_NAME = "adv_cart_session";
// One year — long enough that returning shoppers find their cart
// still there, short enough that abandoned carts don't pile up forever.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Read the cookie if present, otherwise undefined. Does NOT create one. */
export async function readAnonymousSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

/**
 * Read the cookie, or create + set a new one if absent. Use this from
 * Server Actions where it's safe to mutate cookies (Server Components
 * can't set cookies — would throw).
 */
export async function getOrCreateAnonymousSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const fresh = randomUUID();
  store.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return fresh;
}

/** Clear the anon-cart cookie. Called after a successful sign-in merge. */
export async function clearAnonymousSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
