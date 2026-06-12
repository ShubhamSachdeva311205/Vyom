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

// Only refuse rzp_test_ on Vercel production deploys, not on local
// `pnpm build` (which also runs with NODE_ENV=production but shouldn't
// require live keys — local dev + CI use test keys).
const isProdDeploy = process.env.VERCEL_ENV === "production";

// A secret that MUST be present on a real production deploy. Stays optional
// on local dev / CI / `pnpm build` so those don't need live creds. Fixes the
// fail-open hole where a prod deploy missing the service-role key or webhook
// secret booted cleanly instead of failing fast (#112).
const requiredOnProdDeploy = (msg: string) =>
  z
    .string()
    .optional()
    .refine((val) => !isProdDeploy || (!!val && val.length > 0), { message: msg });

const razorpayKeyId = z
  .string()
  .optional()
  .refine(
    (val) => !isProdDeploy || !val || val.startsWith("rzp_live_"),
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
  NEXT_PUBLIC_SUPABASE_URL: isProdDeploy
    ? z.string().url("NEXT_PUBLIC_SUPABASE_URL is required in production")
    : z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredOnProdDeploy(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production",
  ),
  SUPABASE_SERVICE_ROLE_KEY: requiredOnProdDeploy(
    "SUPABASE_SERVICE_ROLE_KEY is required in production",
  ),

  // ---- Google OAuth (read by supabase/config.toml — see SETUP-PHASE-2.md §4) ----
  SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID: z.string().optional(),
  SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET: z.string().optional(),

  // ---- Cloudinary (community image/video uploads) — public, unsigned preset.
  // The browser uploads directly to Cloudinary so media never touches Supabase.
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().optional(),

  // ---- Razorpay (Phase 3) ----
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: requiredOnProdDeploy(
    "RAZORPAY_KEY_SECRET is required in production",
  ),
  RAZORPAY_WEBHOOK_SECRET: requiredOnProdDeploy(
    "RAZORPAY_WEBHOOK_SECRET is required in production",
  ),

  // ---- Shiprocket (Phase 3.3) ----
  SHIPROCKET_EMAIL: z.string().email().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  // 6-digit Indian pincode of Mom's warehouse / pickup point. Used as
  // the origin for serviceability checks. Required at runtime when a
  // quote is requested — surfaced via a clear error.
  SHIPROCKET_PICKUP_PINCODE: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Must be a 6-digit pincode")
    .optional(),
  // Nickname of the pickup address in Mom's Shiprocket dashboard.
  // First-time accounts get one called "Primary" — that's our default.
  SHIPROCKET_PICKUP_LOCATION: z.string().optional().default("Primary"),

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

// Coerce blank strings to undefined so .optional() catches them; otherwise
// `KEY=` in .env.local would fail .url() etc. before the schema sees it.
const cleaned = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
);

const parsed = envSchema.safeParse(cleaned);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables — see logs above.");
}

export const env = parsed.data;
export type Env = typeof env;
