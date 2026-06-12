import "server-only";
import { randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const REWARD_NOTE = "Feedback reward — 15% off";
const VALID_DAYS = 60;

function rewardCode(): string {
  const b = randomBytes(8);
  const c: string[] = [];
  for (let i = 0; i < 8; i++) c.push(ALPHABET[b[i] % ALPHABET.length]);
  return `THANKS-${c.slice(0, 4).join("")}-${c.slice(4, 8).join("")}`;
}

/**
 * Grants a single-use 15%-off coupon to a customer who left feedback, and
 * returns its code (shown on-screen — option A, no extra email). Idempotent
 * per user: reuses an existing unredeemed, unexpired reward instead of minting
 * a new one on every feedback, so it can't be farmed. Signed-in users only
 * (we key the dedupe on created_by). Returns null on failure.
 */
export async function grantFeedbackReward(userId: string): Promise<string | null> {
  const service = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: existing } = await service
    .from("coupons")
    .select("code, expires_at")
    .eq("created_by", userId)
    .eq("notes", REWARD_NOTE)
    .eq("uses_count", 0)
    .limit(10);
  const active = (existing ?? []).find((c) => !c.expires_at || c.expires_at > nowIso);
  if (active) return active.code;

  const code = rewardCode();
  const { error } = await service.from("coupons").insert({
    code,
    type: "single_use",
    discount_percent: 15,
    max_uses: 1,
    multi_use_per_user: false,
    excludes_amazon: true,
    created_by: userId,
    expires_at: new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    notes: REWARD_NOTE,
  });
  if (error) {
    console.error("[reward] grant failed:", error.message);
    return null;
  }
  return code;
}
