"use server";

/**
 * Back-in-stock notification requests (#98). Guest-friendly; deduped per
 * (book, email). Admin sees the waitlist; restock-time emails are a follow-up.
 */

import { z } from "zod";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

const schema = z.object({
  bookId: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email"),
});

export async function requestStockNotification(
  raw: z.input<typeof schema>,
): Promise<ActionResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const rl = await rateLimit("stock-notify", { limit: 5, windowSec: 600 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Plain insert (a PostgREST upsert trips RLS here). A duplicate just means
  // they're already on the waitlist — treat the unique violation as success.
  const { error } = await supabase.from("stock_notifications").insert({
    book_id: parsed.data.bookId,
    email: parsed.data.email.toLowerCase(),
    user_id: user?.id ?? null,
  });
  if (error) {
    if (error.code === "23505") return { success: true }; // already requested
    console.error("[stock] notify request failed:", error.message);
    return { success: false, error: "Could not save your request. Please try again." };
  }
  return { success: true };
}
