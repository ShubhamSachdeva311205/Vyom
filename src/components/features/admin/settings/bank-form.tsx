"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateBankDetails } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/layouts/stack";
import type { BankDetails } from "@/lib/settings/queries";

export function BankForm({ initial }: { initial: BankDetails }) {
  const [name, setName] = useState(initial.name);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [ifsc, setIfsc] = useState(initial.ifsc);
  const [branch, setBranch] = useState(initial.branch);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      const result = await updateBankDetails({ name, accountNumber, ifsc, branch });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSaved(true);
      toast.success("Bank details saved.");
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={3}>
        <FormField label="Bank name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Account number">
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </FormField>
          <FormField label="IFSC">
            <Input
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              required
            />
          </FormField>
        </div>
        <FormField label="Branch">
          <Input value={branch} onChange={(e) => setBranch(e.target.value)} required />
        </FormField>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save bank details
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
