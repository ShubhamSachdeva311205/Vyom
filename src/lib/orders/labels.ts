/**
 * Pure label / enum helpers for orders. Lives outside `src/actions/`
 * because a `"use server"` file can only export async functions —
 * exporting constants or sync helpers from a Server Actions file is a
 * Turbopack build error.
 *
 * Safe to import from both server and client code.
 */

export const ORDER_STATUS_VALUES = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "on_hold",
  "partially_refunded",
] as const;
export type OrderStatusV2 = (typeof ORDER_STATUS_VALUES)[number];

export const COURIER_VALUES = [
  "shiprocket",
  "delhivery",
  "bluedart",
  "dtdc",
  "ekart",
  "indiapost",
  "other",
] as const;
export type CourierName = (typeof COURIER_VALUES)[number];

const COURIER_LABELS: Record<CourierName, string> = {
  shiprocket: "Shiprocket",
  delhivery: "Delhivery",
  bluedart: "Blue Dart",
  dtdc: "DTDC",
  ekart: "Ekart",
  indiapost: "India Post",
  other: "Other",
};

export function courierLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const v = value as CourierName;
  return COURIER_LABELS[v] ?? value;
}

const STATUS_LABEL: Record<OrderStatusV2, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  on_hold: "On hold",
  partially_refunded: "Part refund",
};

export function statusLabel(s: OrderStatusV2): string {
  return STATUS_LABEL[s];
}
