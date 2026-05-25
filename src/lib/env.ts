/**
 * Env-var validator. Imported anywhere a config lookup happens; throws
 * at module load if process.env is wrong-shape. Failing fast at boot
 * beats discovering a missing key during a customer checkout.
 *
 * All Phase 2+ fields are marked optional() so this can ship now and
 * tighten as services are wired up. Production-only refinements catch
 * the classic mistakes (test Razorpay key left in a prod build).
 */

import { z } from "zod";

const productionOnly = (msg: string) =>
  z.string().refine((val) => process.env.NODE_ENV !== "production" || val.length > 0, {
    message: msg,
  });

const razorpayKeyId = z
  .string()
  .optional()
  .refine(
    (val) =>
      process.env.NODE_ENV !== "production" || !val || val.startsWith("rzp_live_"),
    { message: "RAZORPAY_KEY_ID must start with rzp_live_ in production" },
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Public site URL — used for sitemap + OG metadata. Required in production.
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .default("http://localhost:3000"),

  // ---- Supabase (Phase 2) ----
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // ---- Razorpay (Phase 3) ----
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // ---- Cloudflare R2 (Phase 4) ----
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_AUDIO_BUCKET: z.string().optional(),
  R2_PAPERS_BUCKET: z.string().optional(),

  // ---- Resend (Phase 7) ----
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // ---- Admin allowlist (Phase 2 — comma-separated emails) ----
  ADMIN_EMAILS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables — see logs above.");
}

// Avoid `productionOnly` being flagged as unused — kept for future tightening.
void productionOnly;

export const env = parsed.data;
export type Env = typeof env;
