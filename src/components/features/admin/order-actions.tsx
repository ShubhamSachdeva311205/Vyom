"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setOrderTracking, updateOrderStatus } from "@/actions/admin-orders";
import {
  COURIER_VALUES,
  ORDER_STATUS_VALUES,
  courierLabel,
  statusLabel,
  type OrderStatusV2,
} from "@/lib/orders/labels";
import { cn } from "@/lib/utils";

/* ============================================================
 * StatusActions — quick next-state button + dropdown for jumps.
 * ============================================================ */
const FLOW: OrderStatusV2[] = ["paid", "packed", "shipped", "delivered"];

export function StatusActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatusV2;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function flip(next: OrderStatusV2) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId, newStatus: next });
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  const idx = FLOW.indexOf(currentStatus);
  const nextInFlow = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;

  const PRIMARY_LABEL: Record<OrderStatusV2, string> = {
    pending_payment: "Awaiting payment",
    paid: "Mark as Packed",
    packed: "Mark as Shipped",
    shipped: "Mark as Delivered",
    delivered: "Delivered ✓",
    cancelled: "Cancelled",
    refunded: "Refunded",
    on_hold: "On hold",
    partially_refunded: "Part refund",
  };

  return (
    <div className="flex flex-col gap-3">
      {nextInFlow ? (
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={() => flip(nextInFlow)}
          disabled={pending}
          className="w-full"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {PRIMARY_LABEL[currentStatus]}
        </Button>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status-jump" className="text-caption">
          Change to a different status
        </Label>
        <Select
          value={currentStatus}
          onValueChange={(v) => flip(v as OrderStatusV2)}
          disabled={pending}
        >
          <SelectTrigger id="status-jump" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

/* ============================================================
 * TrackingForm — capture Shiprocket number + courier.
 * ============================================================ */
export function TrackingForm({
  orderId,
  initialTrackingNumber,
  initialCourier,
  initialTrackingUrl,
}: {
  orderId: string;
  initialTrackingNumber: string | null;
  initialCourier: string | null;
  initialTrackingUrl: string | null;
}) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [courier, setCourier] = useState<string>(initialCourier ?? "shiprocket");
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setOrderTracking({
        orderId,
        trackingNumber,
        courierName: courier as (typeof COURIER_VALUES)[number],
        trackingUrl: trackingUrl || undefined,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tracking-number">Tracking number</Label>
          <Input
            id="tracking-number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. SR123456789"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tracking-courier">Courier</Label>
          <Select value={courier} onValueChange={setCourier}>
            <SelectTrigger id="tracking-courier" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURIER_VALUES.map((c) => (
                <SelectItem key={c} value={c}>
                  {courierLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tracking-url">Tracking URL (optional)</Label>
        <Input
          id="tracking-url"
          type="url"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://shiprocket.co/tracking/…"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="default" disabled={pending || !trackingNumber.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Save tracking
        </Button>
        {saved ? (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" aria-hidden="true" />
            Saved
          </span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}

/* ============================================================
 * CopyButton — copy any string with one tap.
 * ============================================================ */
export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      className={cn("gap-1.5", className)}
    >
      {copied ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}
