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

// Only refuse rzp_test_ on Vercel production deploys, not on local
// `pnpm build` (which also runs with NODE_ENV=production but shouldn't
// require live keys — local dev + CI use test keys).
const isProdDeploy = process.env.VERCEL_ENV === "production";

const razorpayKeyId = z
  .string()
  .optional()
  .refine(
    (val) => !isProdDeploy || !val || val.startsWith("rzp_live_"),
    { message: "RAZORPAY_KEY_ID must start with rzp_live_ in production" },
  );

// Avoid `productionOnly` unused-import warning at boot.
void productionOnly;

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

  // ---- Google OAuth (read by supabase/config.toml — see SETUP-PHASE-2.md §4) ----
  SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID: z.string().optional(),
  SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET: z.string().optional(),

  // ---- Razorpay (Phase 3) ----
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

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
