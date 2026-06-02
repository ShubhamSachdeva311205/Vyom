"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateVendorCoupon } from "@/actions/admin-coupons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack, Row } from "@/components/layouts/stack";

export function CouponGenerator() {
  const [discount, setDiscount] = useState("");
  const [vendor, setVendor] = useState("");
  const [expires, setExpires] = useState("");
  const [multiUse, setMultiUse] = useState(false);
  const [maxUses, setMaxUses] = useState("10");
  const [pending, startTransition] = useTransition();
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGenerated(null);
    setCopied(false);

    const discountNum = parseInt(discount, 10);
    if (!Number.isFinite(discountNum) || discountNum < 1 || discountNum > 100) {
      toast.error("Discount must be 1–100.");
      return;
    }
    const usesNum = multiUse ? Math.max(1, parseInt(maxUses, 10) || 1) : 1;

    startTransition(async () => {
      const result = await generateVendorCoupon({
        discountPercent: discountNum,
        vendorName: vendor.trim(),
        expiresAt: expires || undefined,
        maxUses: usesNum,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const code = result.data?.code ?? "";
      setGenerated(code);
      toast.success(`Generated ${code}`);
    });
  }

  function copy() {
    if (!generated) return;
    void navigator.clipboard.writeText(generated).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <Stack gap={4}>
      <form onSubmit={onSubmit}>
        <Stack gap={3}>
          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
            <FormField label="Discount % *">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="20"
                required
              />
            </FormField>
            <FormField
              label="Vendor / who is this for? *"
              description="Stored in the coupon's notes so you can recall who got it."
            >
              <Input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. AmazonBlog, school visit, partner XYZ"
                maxLength={120}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Expires on (optional)"
              description="Leave blank for no expiry."
            >
              <Input
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
            </FormField>

            <Stack gap={2}>
              <label className="flex items-start gap-3 cursor-pointer mt-6">
                <Checkbox
                  checked={multiUse}
                  onCheckedChange={(c) => setMultiUse(Boolean(c))}
                />
                <div>
                  <Label className="text-body font-medium">Multi-use</Label>
                  <p className="text-caption text-muted-foreground">
                    By default, vendor codes work once. Enable to let a vendor
                    hand it out N times.
                  </p>
                </div>
              </label>
              {multiUse ? (
                <FormField label="Max uses">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </FormField>
              ) : null}
            </Stack>
          </div>

          <Row gap={2}>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              Generate code
            </Button>
          </Row>
        </Stack>
      </form>

      {generated ? (
        <div className="rounded-md border border-success/40 bg-success/10 p-4">
          <Stack gap={2}>
            <p className="text-caption text-muted-foreground">
              Code generated. Share this with the vendor — it&apos;s the only
              copy you&apos;ll see.
            </p>
            <Row gap={2} align="center" className="flex-wrap">
              <code className="text-lg font-mono font-bold tracking-wider px-3 py-2 rounded-md bg-background border border-border">
                {generated}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copy}>
                {copied ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </Row>
          </Stack>
        </div>
      ) : null}
    </Stack>
  );
}
