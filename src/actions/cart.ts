"use server";

/**
 * Cart Server Actions.
 *
 * Discriminated-union return shape per CLAUDE.md §4. No throws on
 * user-facing paths.
 *
 * Ownership flow:
 *   - Anonymous visitors: cart attached to an HttpOnly cookie
 *     (adv_cart_session). Cookie is created on first addToCart.
 *   - Authenticated users: cart attached to user_id. Anon cart from
 *     the same browser merges on sign-in via mergeAnonymousCartIntoUser
 *     (called from the auth flow, not from the storefront).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clearAnonymousSessionCookie,
  getOrCreateAnonymousSessionId,
  readAnonymousSessionId,
} from "@/lib/cart/session";
import {
  findCartForOwner,
  getOrCreateCart,
  resolveCartOwner,
  type CartOwner,
} from "@/lib/cart/queries";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const uuid = z.string().uuid();
const quantity = z.number().int().min(1).max(99);

/* -----------------------------------------------------------------
 * addToCart — body { bookId, quantity? }. If the visitor has no
 * anonymous cookie + no auth, we set the anon cookie here. Upserts
 * on (cart_id, book_id) — adding the same book again increments.
 * ----------------------------------------------------------------- */
export async function addToCart(
  bookId: string,
  qty: number = 1,
): Promise<ActionResult<{ cartItemCount: number }>> {
  const bookIdParsed = uuid.safeParse(bookId);
  const qtyParsed = quantity.safeParse(qty);
  if (!bookIdParsed.success) return { success: false, error: "Invalid book id" };
  if (!qtyParsed.success) return { success: false, error: "Quantity must be 1–99" };

  // Resolve owner — create an anon session if needed (first add).
  const owner = await resolveOwnerOrCreateAnon();
  const cart = await getOrCreateCart(owner);
  if (!cart) return { success: false, error: "Could not open a cart. Try again." };

  const supabase = createServiceClient();

  // Stock gate. Reads inventory_count + is_active. If the book is
  // inactive OR adding qty would exceed available stock, refuse.
  const { data: book } = await supabase
    .from("books")
    .select("inventory_count, is_active, title")
    .eq("id", bookIdParsed.data)
    .maybeSingle();
  if (!book || !book.is_active) {
    return { success: false, error: "This book isn't available." };
  }
  if (book.inventory_count <= 0) {
    return { success: false, error: `"${book.title}" is sold out.` };
  }

  // Read existing line; either insert or increment.
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("book_id", bookIdParsed.data)
    .maybeSingle();

  const currentInCart = existing?.quantity ?? 0;
  const requestedTotal = currentInCart + qtyParsed.data;
  if (requestedTotal > book.inventory_count) {
    const can = Math.max(0, book.inventory_count - currentInCart);
    return {
      success: false,
      error:
        can === 0
          ? `Only ${book.inventory_count} of "${book.title}" available — already in your cart.`
          : `Only ${book.inventory_count} of "${book.title}" available. You can add ${can} more.`,
    };
  }

  if (existing) {
    const nextQty = Math.min(requestedTotal, 99);
    const { error: updErr } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", existing.id);
    if (updErr) return { success: false, error: "Could not update cart item." };
  } else {
    const { error: insErr } = await supabase
      .from("cart_items")
      .insert({ cart_id: cart.id, book_id: bookIdParsed.data, quantity: qtyParsed.data });
    if (insErr) return { success: false, error: "Could not add to cart." };
  }

  const cartItemCount = await sumCartQuantity(cart.id);
  revalidatePath("/cart");
  return { success: true, data: { cartItemCount } };
}

/* -----------------------------------------------------------------
 * updateCartItemQuantity — change quantity for an existing line.
 * Quantity 0 removes the line.
 * ----------------------------------------------------------------- */
export async function updateCartItemQuantity(
  cartItemId: string,
  qty: number,
): Promise<ActionResult<{ cartItemCount: number }>> {
  const idParsed = uuid.safeParse(cartItemId);
  if (!idParsed.success) return { success: false, error: "Invalid item id" };
  if (!Number.isInteger(qty) || qty < 0 || qty > 99) {
    return { success: false, error: "Quantity must be 0–99" };
  }

  const owner = await resolveCartOwner();
  if (!owner) return { success: false, error: "No cart to update." };
  const cart = await findCartForOwner(owner);
  if (!cart) return { success: false, error: "No cart to update." };

  const supabase = createServiceClient();

  // Verify ownership: the cart item must belong to this owner's cart.
  const { data: item } = await supabase
    .from("cart_items")
    .select("id, cart_id, book_id")
    .eq("id", idParsed.data)
    .maybeSingle();
  if (!item || item.cart_id !== cart.id) {
    return { success: false, error: "Item not found." };
  }

  if (qty === 0) {
    const { error } = await supabase.from("cart_items").delete().eq("id", idParsed.data);
    if (error) return { success: false, error: "Could not remove item." };
  } else {
    // Stock check on increase. Pull current book stock; refuse if the
    // new quantity would exceed available.
    const { data: book } = await supabase
      .from("books")
      .select("inventory_count, is_active, title")
      .eq("id", item.book_id)
      .maybeSingle();
    if (!book || !book.is_active) {
      return { success: false, error: "This book isn't available." };
    }
    if (qty > book.inventory_count) {
      return {
        success: false,
        error: `Only ${book.inventory_count} of "${book.title}" available.`,
      };
    }
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: qty })
      .eq("id", idParsed.data);
    if (error) return { success: false, error: "Could not update item." };
  }

  const cartItemCount = await sumCartQuantity(cart.id);
  revalidatePath("/cart");
  return { success: true, data: { cartItemCount } };
}

/* -----------------------------------------------------------------
 * removeCartItem — convenience wrapper over updateCartItemQuantity(0).
 * ----------------------------------------------------------------- */
export async function removeCartItem(
  cartItemId: string,
): Promise<ActionResult<{ cartItemCount: number }>> {
  return updateCartItemQuantity(cartItemId, 0);
}

/* -----------------------------------------------------------------
 * mergeAnonymousCartIntoUserCart — called from the auth callback
 * after a successful sign-in. Re-attaches anon cart items to the
 * user's cart (summing quantities on collisions) and deletes the
 * anon cart row + clears the cookie.
 * ----------------------------------------------------------------- */
export async function mergeAnonymousCartIntoUserCart(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const anonId = await readAnonymousSessionId();
  if (!anonId) return { success: true }; // nothing to merge — no anon cart

  const service = createServiceClient();

  // Look up both carts.
  const [{ data: anonCart }, { data: userCart }] = await Promise.all([
    service.from("carts").select("id").eq("anonymous_session_id", anonId).maybeSingle(),
    service.from("carts").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!anonCart) {
    // No anon cart in DB despite cookie. Just clear cookie.
    await clearAnonymousSessionCookie();
    return { success: true };
  }

  // If the user has no cart, just claim the anon cart by swapping the FK.
  if (!userCart) {
    await service
      .from("carts")
      .update({ user_id: user.id, anonymous_session_id: null })
      .eq("id", anonCart.id);
    await clearAnonymousSessionCookie();
    revalidatePath("/cart");
    return { success: true };
  }

  // Both carts exist — merge line items.
  const { data: anonItems } = await service
    .from("cart_items")
    .select("book_id, quantity")
    .eq("cart_id", anonCart.id);

  if (anonItems && anonItems.length > 0) {
    const { data: userItems } = await service
      .from("cart_items")
      .select("id, book_id, quantity")
      .eq("cart_id", userCart.id);

    const userByBook = new Map(
      (userItems ?? []).map((it) => [it.book_id, { id: it.id, quantity: it.quantity }]),
    );

    for (const anonItem of anonItems) {
      const existing = userByBook.get(anonItem.book_id);
      if (existing) {
        const merged = Math.min(existing.quantity + anonItem.quantity, 99);
        await service.from("cart_items").update({ quantity: merged }).eq("id", existing.id);
      } else {
        await service
          .from("cart_items")
          .insert({ cart_id: userCart.id, book_id: anonItem.book_id, quantity: anonItem.quantity });
      }
    }
  }

  // Drop the anon cart (cascade removes its line items).
  await service.from("carts").delete().eq("id", anonCart.id);
  await clearAnonymousSessionCookie();

  revalidatePath("/cart");
  return { success: true };
}

/* -----------------------------------------------------------------
 * Internal helpers
 * ----------------------------------------------------------------- */
async function resolveOwnerOrCreateAnon(): Promise<CartOwner> {
  const owner = await resolveCartOwner();
  if (owner) return owner;
  const anonId = await getOrCreateAnonymousSessionId();
  return { kind: "anon", sessionId: anonId };
}

async function sumCartQuantity(cartId: string): Promise<number> {
  const service = createServiceClient();
  const { data } = await service.from("cart_items").select("quantity").eq("cart_id", cartId);
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
}
