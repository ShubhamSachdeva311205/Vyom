"use server";

/**
 * Customer account Server Actions (B4). Update display name, password,
 * and email for the signed-in user. Discriminated-union returns per
 * CLAUDE.md §4.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rateLimit, TOO_MANY_ATTEMPTS } from "@/lib/auth/rate-limit";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const nameSchema = z.string().trim().min(1, "Name is required").max(120);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");
const emailSchema = z.string().trim().email("Enter a valid email");

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateDisplayName(formData: FormData): Promise<ActionResult> {
  const parsed = nameSchema.safeParse(formData.get("fullName")?.toString() ?? "");
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Not signed in." };

  // Mirror to auth metadata + the public.users profile row.
  const { error: authErr } = await supabase.auth.updateUser({
    data: { full_name: parsed.data },
  });
  if (authErr) return { success: false, error: authErr.message };
  const { error: profileErr } = await supabase.from("users").update({ full_name: parsed.data }).eq("id", user.id);
  if (profileErr) return { success: false, error: profileErr.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const password = formData.get("password")?.toString() ?? "";
  const confirm = formData.get("confirm")?.toString() ?? "";
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }
  if (password !== confirm) {
    return { success: false, error: "Passwords don't match." };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Not signed in." };

  const rl = await rateLimit(`change-password:${user.id}`, { limit: 5, windowSec: 300 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function changeEmail(formData: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(formData.get("email")?.toString() ?? "");
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Not signed in." };
  if (parsed.data.toLowerCase() === user.email?.toLowerCase()) {
    return { success: false, error: "That's already your email." };
  }

  const rl = await rateLimit(`change-email:${user.id}`, { limit: 4, windowSec: 300 });
  if (!rl.ok) return { success: false, error: TOO_MANY_ATTEMPTS };

  // Supabase sends a confirmation link to the NEW address; the change
  // only takes effect once confirmed.
  const { error } = await supabase.auth.updateUser({ email: parsed.data });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
