"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { declineRefund, refundOrder } from "@/actions/admin-refunds";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RefundDialogProps {
  orderId: string;
  totalPaise: number;
  alreadyRefundedPaise: number;
  /** From orders.non_refundable_fee_paise. Null for pre-fix orders → estimate. */
  capturedFeePaise: number | null;
}

type Mode = "full" | "minus_fee" | "custom" | "decline";

export function RefundDialog({
  orderId,
  totalPaise,
  alreadyRefundedPaise,
  capturedFeePaise,
}: RefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("full");
  const [customRupees, setCustomRupees] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const remaining = Math.max(0, totalPaise - alreadyRefundedPaise);
  // Best-effort fee: prefer the captured value, fall back to a ~2.36%
  // estimate so the dialog is still useful on pre-fix orders.
  const estimatedFeePaise =
    capturedFeePaise ?? Math.round(totalPaise * 0.0236);
  // For partial refunds the proportional fee loss is the part of the
  // original fee that maps to the refunded slice.
  function feeForAmount(amountPaise: number): number {
    if (totalPaise <= 0) return 0;
    return Math.round((amountPaise / totalPaise) * estimatedFeePaise);
  }

  const amountForMode = (() => {
    switch (mode) {
      case "full":
        return remaining;
      case "minus_fee":
        return Math.max(0, remaining - feeForAmount(remaining));
      case "custom": {
        const r = parseInt(customRupees, 10);
        return Number.isFinite(r) ? Math.min(remaining, Math.max(0, r * 100)) : 0;
      }
      case "decline":
        return 0;
    }
  })();

  const customerReceives = amountForMode;
  const momLoses = mode === "decline" ? 0 : feeForAmount(amountForMode);
  const momNetRecoups = totalPaise - alreadyRefundedPaise - amountForMode;

  function onConfirm() {
    if (reason.trim().length < (mode === "decline" ? 10 : 2)) {
      toast.error(
        mode === "decline"
          ? "Decline needs a detailed reason (10+ characters)."
          : "Please add a brief reason.",
      );
      return;
    }
    startTransition(async () => {
      if (mode === "decline") {
        const result = await declineRefund({ orderId, reason });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Refund declined. Logged.");
        setOpen(false);
        return;
      }
      if (amountForMode <= 0) {
        toast.error("Refund amount must be greater than zero.");
        return;
      }
      const result = await refundOrder({
        orderId,
        amountPaise: amountForMode,
        reason,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Refunded ${formatINR(amountForMode)}.`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="md" className="w-full">
          Issue refund
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund this order</DialogTitle>
          <DialogDescription>
            Picks which slice of the payment goes back to the customer.
            Razorpay fees are non-refundable.
          </DialogDescription>
        </DialogHeader>

        <Stack gap={4}>
          {/* Numbers strip */}
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-caption">
            <span className="text-muted-foreground">Original payment</span>
            <span className="text-right tabular-nums">{formatINR(totalPaise)}</span>
            <span className="text-muted-foreground">
              Razorpay fee {capturedFeePaise === null ? "(est. 2.36%)" : ""}
            </span>
            <span className="text-right tabular-nums">{formatINR(estimatedFeePaise)}</span>
            {alreadyRefundedPaise > 0 ? (
              <>
                <span className="text-muted-foreground">Already refunded</span>
                <span className="text-right tabular-nums">
                  − {formatINR(alreadyRefundedPaise)}
                </span>
              </>
            ) : null}
            <span className="text-muted-foreground">Refundable now</span>
            <span className="text-right tabular-nums font-medium">
              {formatINR(remaining)}
            </span>
          </div>

          {/* Mode buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ModeButton
              label="Full"
              sub={formatINR(remaining)}
              active={mode === "full"}
              onClick={() => setMode("full")}
            />
            <ModeButton
              label="Minus fee"
              sub={formatINR(Math.max(0, remaining - feeForAmount(remaining)))}
              active={mode === "minus_fee"}
              onClick={() => setMode("minus_fee")}
            />
            <ModeButton
              label="Custom"
              sub="Set amount"
              active={mode === "custom"}
              onClick={() => setMode("custom")}
            />
            <ModeButton
              label="Decline"
              sub="No money moves"
              active={mode === "decline"}
              onClick={() => setMode("decline")}
              danger
            />
          </div>

          {mode === "custom" ? (
            <FormField
              label="Custom refund amount (₹)"
              description={`Cap: ₹${Math.round(remaining / 100)}.`}
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.floor(remaining / 100)}
                value={customRupees}
                onChange={(e) => setCustomRupees(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </FormField>
          ) : null}

          {/* Outcome preview */}
          {mode !== "decline" ? (
            <div className="rounded-md border border-border bg-card p-3 text-caption">
              <Row align="center" justify="between">
                <span className="text-muted-foreground">Customer gets</span>
                <span className="tabular-nums font-medium">
                  {formatINR(customerReceives)}
                </span>
              </Row>
              <Row align="center" justify="between">
                <span className="text-muted-foreground">Mom loses (fee)</span>
                <span className="tabular-nums text-destructive">
                  {formatINR(momLoses)}
                </span>
              </Row>
              <Row align="center" justify="between" className="pt-1 border-t border-border mt-1">
                <span className="text-muted-foreground">Mom net-recoups</span>
                <span className="tabular-nums font-medium">
                  {formatINR(Math.max(0, momNetRecoups))}
                </span>
              </Row>
            </div>
          ) : (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-caption">
              <p>
                Logged as a declined refund. No money moves. Customer is not
                notified automatically — reach out to them separately.
              </p>
            </div>
          )}

          <FormField
            label={mode === "decline" ? "Reason (required, 10+ characters)" : "Reason"}
            description="Visible in admin audit log. Mention dispute / customer ID / proof if relevant."
          >
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                mode === "decline"
                  ? "e.g. Repeat fraud signals from this customer's account. Discount stacking attempt logged 2026-…"
                  : "e.g. Customer accidental double-order"
              }
            />
          </FormField>
        </Stack>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={mode === "decline" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending || (mode !== "decline" && amountForMode <= 0)}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {mode === "decline" ? "Decline refund" : `Refund ${formatINR(amountForMode)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  label,
  sub,
  active,
  danger,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors",
        active
          ? danger
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-accent/40",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className={cn("text-caption", active && !danger ? "text-background/80" : "text-muted-foreground")}>
        {sub}
      </span>
    </button>
  );
}
