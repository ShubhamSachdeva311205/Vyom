import { Check, Package, PackageCheck, Truck, Home, AlertCircle } from "lucide-react";
import { Stack, Row } from "@/components/layouts/stack";
import { CopyInline } from "./copy-inline";

/**
 * On-site order tracking (#116). Renders the shipment journey entirely inside
 * our site — customers never get bounced to shiprocket.co. The timeline is
 * driven by our own order status + timestamps, which the Shiprocket webhook
 * (#87) keeps fresh, so it reflects real movement (Picked up → In transit →
 * Delivered) without an external redirect.
 */
type StepKey = "paid" | "packed" | "shipped" | "delivered";

const STEPS: { key: StepKey; label: string; hint: string; icon: typeof Package }[] = [
  { key: "paid", label: "Order confirmed", hint: "Payment received", icon: PackageCheck },
  { key: "packed", label: "Packed", hint: "Getting your parcel ready", icon: Package },
  { key: "shipped", label: "Shipped", hint: "On its way to you", icon: Truck },
  { key: "delivered", label: "Delivered", hint: "Arrived at your address", icon: Home },
];

const RANK: Record<string, number> = { paid: 0, packed: 1, shipped: 2, delivered: 3 };

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface OrderTrackingProps {
  status: string;
  paidAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  onHoldAt: string | null;
  trackingNumber: string | null;
  courierName: string | null;
}

export function OrderTrackingTimeline({
  status,
  paidAt,
  packedAt,
  shippedAt,
  deliveredAt,
  onHoldAt,
  trackingNumber,
  courierName,
}: OrderTrackingProps) {
  const stamps: Record<StepKey, string | null> = {
    paid: paidAt,
    packed: packedAt,
    shipped: shippedAt,
    delivered: deliveredAt,
  };
  const currentRank = RANK[status] ?? 0;

  // On-hold / cancelled get an explicit callout above the stepper.
  const exception =
    status === "on_hold"
      ? {
          tone: "warn" as const,
          text: "This order is on hold — we're sorting out a delivery issue and will be in touch.",
          at: fmt(onHoldAt),
        }
      : status === "cancelled"
        ? { tone: "warn" as const, text: "This order was cancelled.", at: null }
        : null;

  return (
    <Stack gap={4}>
      <span className="text-eyebrow">Tracking</span>

      {exception ? (
        <Row
          gap={2}
          align="start"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30"
        >
          <AlertCircle className="size-4 mt-0.5 text-amber-600 dark:text-amber-500" aria-hidden="true" />
          <p className="text-caption text-amber-900 dark:text-amber-200">
            {exception.text}
            {exception.at ? <span className="block opacity-70">{exception.at}</span> : null}
          </p>
        </Row>
      ) : null}

      <ol className="flex flex-col">
        {STEPS.map((step, i) => {
          const reached = i <= currentRank && status !== "cancelled";
          const isCurrent = i === currentRank && status !== "delivered" && status !== "cancelled";
          const at = fmt(stamps[step.key]);
          const Icon = reached ? (i < currentRank ? Check : step.icon) : step.icon;
          const isLast = i === STEPS.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              {/* Rail: dot + connector */}
              <div className="flex flex-col items-center">
                <span
                  className={[
                    "flex size-7 items-center justify-center rounded-full border transition-colors",
                    reached
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-muted text-muted-foreground",
                    isCurrent ? "ring-2 ring-brand/30" : "",
                  ].join(" ")}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                {!isLast ? (
                  <span
                    className={[
                      "w-px flex-1 my-1",
                      i < currentRank ? "bg-brand" : "bg-border",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {/* Label */}
              <div className={isLast ? "pb-0" : "pb-5"}>
                <p
                  className={
                    reached ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"
                  }
                >
                  {step.label}
                </p>
                <p className="text-caption text-muted-foreground">{at ?? step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {trackingNumber && currentRank >= RANK.shipped ? (
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="flex flex-col gap-1">
            <span className="text-caption text-muted-foreground">
              {courierName ?? "Courier"} · AWB
            </span>
            <Row gap={2} align="center" className="flex-wrap">
              <span className="text-sm font-medium font-mono">{trackingNumber}</span>
              <CopyInline value={trackingNumber} label="AWB" />
            </Row>
          </div>
          <p className="text-caption text-muted-foreground mt-2">
            Updates here automatically as your parcel moves.
          </p>
        </div>
      ) : null}
    </Stack>
  );
}
