"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSellerDetails } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stack } from "@/components/layouts/stack";
import type { SellerDetails } from "@/lib/settings/queries";

export function SellerForm({ initial }: { initial: SellerDetails }) {
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.addressLines.join("\n"));
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [gstin, setGstin] = useState(initial.gstin ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      const result = await updateSellerDetails({
        name,
        addressLines: address
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        phone,
        email,
        gstin: gstin || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSaved(true);
      toast.success("Seller details saved.");
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={3}>
        <FormField label="Business name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField
          label="Address (one line per row)"
          description="Shows on the invoice header."
        >
          <Textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
        </div>
        <FormField
          label="GSTIN (optional)"
          description="Leave blank until Mom registers. When set, shows in invoice header + enables HSN/SAC column."
        >
          <Input
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            maxLength={20}
          />
        </FormField>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save seller details
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="size-4" aria-hidden="true" /> Saved
            </span>
          ) : null}
        </div>
      </Stack>
    </form>
  );
}
