import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let cached: Resend | null = null;

/** Resend client, or null when no API key is configured (sends become no-ops). */
export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

/**
 * From-address. Defaults to Resend's onboarding sender for dev (delivers only
 * to your own Resend account email). Set RESEND_FROM_EMAIL to a verified-domain
 * address for production, e.g. "Vyom <orders@yourdomain>".
 */
export const EMAIL_FROM = env.RESEND_FROM_EMAIL || "Vyom <onboarding@resend.dev>";

export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;
