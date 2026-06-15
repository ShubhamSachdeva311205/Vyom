/**
 * Shiprocket API client (Phase 3.3).
 *
 * Reference: https://apidocs.shiprocket.in/
 *
 * Auth model: POST email + password → 10-day JWT. We cache the token
 * in-module for ~9 days (one-day safety margin) so we don't auth on
 * every request. Multiple concurrent calls that hit the cache miss
 * share a single in-flight login via a promise lock.
 *
 * Server-only. Never import from a "use client" boundary — credentials
 * would leak to the browser bundle.
 */

import "server-only";
import { env } from "@/lib/env";

const BASE = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000; // 9 days

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;
let inflightLogin: Promise<string> | null = null;

export class ShiprocketError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ShiprocketError";
  }
}

function requireCredentials(): { email: string; password: string } {
  const email = env.SHIPROCKET_EMAIL;
  const password = env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new ShiprocketError(
      "SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD missing from environment.",
    );
  }
  return { email, password };
}

async function login(): Promise<string> {
  const { email, password } = requireCredentials();
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json().catch(() => null)) as
    | { token?: string; message?: string }
    | null;
  if (!res.ok || !body?.token) {
    throw new ShiprocketError(
      body?.message ?? `Shiprocket auth failed (${res.status})`,
      res.status,
      body,
    );
  }
  return body.token;
}

async function getToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  if (inflightLogin) return inflightLogin;
  inflightLogin = login()
    .then((token) => {
      cached = { token, expiresAt: Date.now() + TOKEN_TTL_MS };
      return token;
    })
    .finally(() => {
      inflightLogin = null;
    });
  return inflightLogin;
}

async function call<T>(
  method: "GET" | "POST",
  path: string,
  init?: { query?: Record<string, string | number>; body?: unknown },
): Promise<T> {
  const token = await getToken();
  const url = new URL(`${BASE}${path}`);
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      `Shiprocket ${method} ${path} failed (${res.status})`;
    throw new ShiprocketError(message, res.status, body);
  }
  return body as T;
}

/* ============================================================
 * Serviceability — list couriers + rates for a delivery pincode.
 * ============================================================ */
export interface ServiceabilityCourier {
  courier_company_id: number;
  courier_name: string;
  freight_charge: number;
  rate: number;
  cod_charges: number;
  etd: string; // "5-7 days"
  is_surface: boolean;
}

export interface ServiceabilityResult {
  available: ServiceabilityCourier[];
  /** Recommended (cheapest) prepaid option, or null if none returned. */
  cheapest: ServiceabilityCourier | null;
}

export async function getServiceability(input: {
  deliveryPincode: string;
  weightGrams: number;
  /**
   * Pickup pincode. Pass from settings.shipping_settings.pickup_pincode
   * when available; falls back to SHIPROCKET_PICKUP_PINCODE env var for
   * older callers / boot-time config.
   */
  pickupPincode?: string | null;
}): Promise<ServiceabilityResult> {
  const pickupPincode = input.pickupPincode ?? env.SHIPROCKET_PICKUP_PINCODE;
  if (!pickupPincode) {
    throw new ShiprocketError(
      "Pickup pincode not configured. Set it in /admin/settings or as SHIPROCKET_PICKUP_PINCODE in .env.local.",
    );
  }
  const weightKg = Math.max(0.1, input.weightGrams / 1000);

  type RawResp = {
    status?: number;
    data?: {
      available_courier_companies?: ServiceabilityCourier[];
    };
  };

  const raw = await call<RawResp>("GET", "/courier/serviceability/", {
    query: {
      pickup_postcode: pickupPincode,
      delivery_postcode: input.deliveryPincode,
      weight: weightKg,
      cod: 0,
    },
  });

  const available = raw.data?.available_courier_companies ?? [];
  // Pick the lowest `rate`. Shiprocket sometimes returns rate=0 for
  // unavailable couriers — filter those out.
  const cheapest =
    available
      .filter((c) => c.rate > 0)
      .sort((a, b) => a.rate - b.rate)[0] ?? null;

  return { available, cheapest };
}

/* ============================================================
 * Order create (adhoc) — used when Mom marks an order as Packed.
 * ============================================================ */
export interface CreateOrderInput {
  /** Our internal order number; shows up in Shiprocket's dashboard. */
  orderId: string;
  orderDate: string; // YYYY-MM-DD HH:mm
  billing: {
    name: string;
    address: string;
    city: string;
    pincode: string;
    state: string;
    country: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    sku: string;
    units: number;
    sellingPricePaise: number;
  }>;
  paymentMethod: "Prepaid" | "COD";
  subTotalPaise: number;
  weightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}

export interface CreateOrderResult {
  /** Shiprocket-internal order id. */
  shiprocketOrderId: number;
  /** Shipment id — used to assign AWB next. */
  shipmentId: number;
  status: string;
  statusCode: number;
  /** Already-assigned AWB if Shiprocket auto-picked one. */
  awbCode?: string;
  courierName?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  type RawResp = {
    order_id: number;
    shipment_id: number;
    status: string;
    status_code: number;
    awb_code?: string;
    courier_name?: string;
  };

  const payload = {
    order_id: input.orderId,
    order_date: input.orderDate,
    pickup_location: env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: input.billing.name,
    billing_address: input.billing.address,
    billing_city: input.billing.city,
    billing_pincode: input.billing.pincode,
    billing_state: input.billing.state,
    billing_country: input.billing.country,
    billing_email: input.billing.email,
    billing_phone: input.billing.phone,
    shipping_is_billing: true,
    order_items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: Math.round(item.sellingPricePaise / 100),
    })),
    payment_method: input.paymentMethod,
    sub_total: Math.round(input.subTotalPaise / 100),
    length: input.lengthCm,
    breadth: input.breadthCm,
    height: input.heightCm,
    weight: Math.max(0.1, input.weightGrams / 1000),
  };

  const raw = await call<RawResp>("POST", "/orders/create/adhoc", { body: payload });
  return {
    shiprocketOrderId: raw.order_id,
    shipmentId: raw.shipment_id,
    status: raw.status,
    statusCode: raw.status_code,
    awbCode: raw.awb_code,
    courierName: raw.courier_name,
  };
}

/* ============================================================
 * AWB assign — needed after createOrder if no awb_code returned.
 * ============================================================ */
export interface AssignAwbResult {
  awbCode: string;
  courierName: string;
  courierCompanyId: number;
}

export async function assignAwb(
  shipmentId: number,
  courierId?: number | null,
): Promise<AssignAwbResult> {
  type RawResp = {
    awb_assign_status?: number;
    response?: {
      data?: {
        awb_code?: string;
        courier_name?: string;
        courier_company_id?: number;
      };
    };
    message?: string;
  };
  // Shiprocket's order-create endpoint ignores courier choice; the customer's
  // pick (#85) is honoured here at AWB assignment via `courier_id`. Omitted
  // when null → Shiprocket auto-picks (cheapest-ish), preserving old behaviour.
  const raw = await call<RawResp>("POST", "/courier/assign/awb", {
    body: courierId ? { shipment_id: shipmentId, courier_id: courierId } : { shipment_id: shipmentId },
  });
  const data = raw.response?.data;
  if (!data?.awb_code) {
    throw new ShiprocketError(
      raw.message ?? "Shiprocket did not return an AWB code",
      undefined,
      raw,
    );
  }
  return {
    awbCode: data.awb_code,
    courierName: data.courier_name ?? "",
    courierCompanyId: data.courier_company_id ?? 0,
  };
}

/* ============================================================
 * Test helper — exported for an admin "Test Shiprocket connection"
 * button later. Just exercises auth.
 * ============================================================ */
export async function pingShiprocket(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getToken();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof ShiprocketError ? err.message : "Unknown Shiprocket error",
    };
  }
}

/** Test-only — clears the in-memory token cache. */
export function _resetShiprocketTokenCache(): void {
  cached = null;
  inflightLogin = null;
}
