"use server";

/**
 * Admin usage & costs dashboard (#129). Aggregates external-service usage:
 * Cloudinary from its live Admin API; Razorpay/email/shipping from our own
 * orders; Supabase storage from a server-only RPC. All server-side, admin-
 * gated; secrets stay in env and are NEVER returned to the client — only
 * aggregate numbers.
 */

import { isAdminEmail } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };
  if (!(await isAdminEmail(user.email))) return { ok: false, error: "Not authorised." };
  return { ok: true };
}

export interface UsageStats {
  cloudinary:
    | { configured: false }
    | {
        configured: true;
        plan?: string;
        creditsUsed?: number;
        creditsLimit?: number;
        creditsPercent?: number;
        storageBytes?: number;
        bandwidthBytes?: number;
        objects?: number;
        transformations?: number;
        error?: string;
      };
  razorpay: {
    paidOrders: number;
    revenuePaise: number;
    feesPaise: number;
    refundedPaise: number;
  };
  email: { sentTotal: number; sentThisMonth: number };
  storage: { buckets: { bucket: string; objects: number; bytes: number }[]; totalBytes: number };
  shipping: { shipped: number };
  generatedAt: string;
}

const PAID = new Set(["paid", "packed", "shipped", "delivered", "partially_refunded", "refunded"]);

export async function getUsageStats(): Promise<ActionResult<UsageStats>> {
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };
  const service = createServiceClient();

  // --- Cloudinary (live Admin API, server-side Basic auth) ---
  let cloudinary: UsageStats["cloudinary"] = { configured: false };
  if (
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET &&
    env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  ) {
    try {
      const auth = Buffer.from(
        `${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`,
      ).toString("base64");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/usage`,
        { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
      );
      if (res.ok) {
        const j = await res.json();
        cloudinary = {
          configured: true,
          plan: j.plan,
          creditsUsed: j.credits?.usage,
          creditsLimit: j.credits?.limit,
          creditsPercent: j.credits?.used_percent,
          storageBytes: j.storage?.usage,
          bandwidthBytes: j.bandwidth?.usage,
          objects: j.objects?.usage,
          transformations: j.transformations?.usage,
        };
      } else {
        cloudinary = { configured: true, error: `Cloudinary API returned ${res.status}` };
      }
    } catch {
      cloudinary = { configured: true, error: "Could not reach Cloudinary." };
    }
  }

  // --- Razorpay / email / shipping — from our own orders (one pass) ---
  const { data: orders } = await service
    .from("orders")
    .select(
      "status, total_paise, non_refundable_fee_paise, refunded_paise, confirmation_email_sent_at, tracking_number",
    )
    .limit(10000);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthIso = monthStart.toISOString();

  let paidOrders = 0,
    revenuePaise = 0,
    feesPaise = 0,
    refundedPaise = 0,
    sentTotal = 0,
    sentThisMonth = 0,
    shipped = 0;
  for (const o of orders ?? []) {
    if (PAID.has(o.status)) {
      paidOrders += 1;
      revenuePaise += o.total_paise ?? 0;
      feesPaise += o.non_refundable_fee_paise ?? 0;
      refundedPaise += o.refunded_paise ?? 0;
    }
    if (o.confirmation_email_sent_at) {
      sentTotal += 1;
      if (o.confirmation_email_sent_at >= monthIso) sentThisMonth += 1;
    }
    if (o.tracking_number) shipped += 1;
  }

  // --- Supabase storage (server-only RPC) ---
  type StorageRow = { bucket: string; object_count: number; total_bytes: number };
  const { data: storageRows } = await service.rpc("get_storage_usage" as never);
  const buckets = ((storageRows as StorageRow[] | null) ?? []).map((r) => ({
    bucket: r.bucket,
    objects: Number(r.object_count),
    bytes: Number(r.total_bytes),
  }));
  const totalBytes = buckets.reduce((s, b) => s + b.bytes, 0);

  return {
    success: true,
    data: {
      cloudinary,
      razorpay: { paidOrders, revenuePaise, feesPaise, refundedPaise },
      email: { sentTotal, sentThisMonth },
      storage: { buckets, totalBytes },
      shipping: { shipped },
      generatedAt: new Date().toISOString(),
    },
  };
}
