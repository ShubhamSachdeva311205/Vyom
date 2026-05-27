import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { readAnonymousSessionId } from "./session";

/**
 * Cart query helpers.
 *
 * Ownership model: a cart belongs to EITHER a user_id OR an
 * anonymous_session_id. The schema enforces exactly one via a CHECK
 * constraint + partial unique indexes (see core migration §carts).
 *
 * These helpers use the service-role client because anonymous cart
 * RLS would require setting `app.anonymous_session_id` on the
 * Postgres session every request — extra round-trips for no security
 * gain (the service client never reaches the browser, and ownership
 * is checked in code).
 */

export type CartRow = Tables<"carts">;
export type CartItemRow = Tables<"cart_items">;
export type BookRow = Tables<"books">;

export type CartLineItem = CartItemRow & { book: BookRow };
export type CartWithItems = CartRow & { items: CartLineItem[] };

export type CartOwner =
  | { kind: "user"; userId: string }
  | { kind: "anon"; sessionId: string };

/**
 * Resolve who the current request's cart belongs to. Authenticated
 * users always take precedence — the anon cookie is ignored in that
 * case and gets merged away on sign-in.
 *
 * Returns `null` if neither identity is present (e.g. cold visit
 * before any add-to-cart action).
 */
export async function resolveCartOwner(): Promise<CartOwner | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { kind: "user", userId: user.id };

  const anon = await readAnonymousSessionId();
  if (anon) return { kind: "anon", sessionId: anon };

  return null;
}

/** Find the cart row for an owner. Returns null if no cart exists yet. */
export async function findCartForOwner(owner: CartOwner): Promise<CartRow | null> {
  const supabase = createServiceClient();
  const query = supabase.from("carts").select("*").limit(1);

  const { data, error } =
    owner.kind === "user"
      ? await query.eq("user_id", owner.userId).maybeSingle()
      : await query.eq("anonymous_session_id", owner.sessionId).maybeSingle();

  if (error) return null;
  return data;
}

/**
 * Find or create the cart for an owner. Idempotent — safe to call from
 * every add-to-cart Server Action.
 */
export async function getOrCreateCart(owner: CartOwner): Promise<CartRow | null> {
  const existing = await findCartForOwner(owner);
  if (existing) return existing;

  const supabase = createServiceClient();
  // Supabase's generated insert type doesn't accept a discriminated
  // union for the owner pair — widen to nullable strings on both
  // columns so a single object literal type is inferred. The DB
  // CHECK constraint still enforces exactly one is set.
  const insert: { user_id: string | null; anonymous_session_id: string | null } =
    owner.kind === "user"
      ? { user_id: owner.userId, anonymous_session_id: null }
      : { user_id: null, anonymous_session_id: owner.sessionId };

  const { data, error } = await supabase
    .from("carts")
    .insert(insert)
    .select("*")
    .single();

  if (error) return null;
  return data;
}

/** Hydrate a cart with its line items + book joins, ready for UI. */
export async function getCartWithItems(cartId: string): Promise<CartWithItems | null> {
  const supabase = createServiceClient();
  const { data: cart, error: cartErr } = await supabase
    .from("carts")
    .select("*")
    .eq("id", cartId)
    .maybeSingle();
  if (cartErr || !cart) return null;

  const { data: items, error: itemsErr } = await supabase
    .from("cart_items")
    .select("*, book:books(*)")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (itemsErr) return { ...cart, items: [] };

  return {
    ...cart,
    items: (items ?? []).map((it) => ({
      ...it,
      book: it.book as BookRow,
    })),
  };
}

/**
 * Read-only convenience: the current request's cart, fully hydrated.
 * Returns null if the visitor has neither an account nor an anon
 * cookie nor a cart yet — UI should render empty state.
 */
export async function getCurrentCart(): Promise<CartWithItems | null> {
  const owner = await resolveCartOwner();
  if (!owner) return null;
  const cart = await findCartForOwner(owner);
  if (!cart) return null;
  return getCartWithItems(cart.id);
}

/** Cheap count for the navbar badge. Avoids hydrating books. */
export async function getCurrentCartItemCount(): Promise<number> {
  const owner = await resolveCartOwner();
  if (!owner) return 0;
  const cart = await findCartForOwner(owner);
  if (!cart) return 0;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cart.id);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + row.quantity, 0);
}
