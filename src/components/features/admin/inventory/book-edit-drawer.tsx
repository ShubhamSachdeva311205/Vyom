"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateBookActive,
  updateBookPrice,
  updateBookStock,
} from "@/actions/admin-inventory";
import type { InventoryRow } from "@/lib/inventory/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";

export function BookEditDrawer({
  book,
  open,
  onOpenChange,
}: {
  book: InventoryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!book) return null;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{book.title}</DrawerTitle>
          {book.subtitle ? (
            <DrawerDescription>{book.subtitle}</DrawerDescription>
          ) : null}
        </DrawerHeader>
        <div className="px-6 pb-6 max-w-2xl mx-auto w-full">
          <BookEditForm book={book} onSaved={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function BookEditForm({
  book,
  onSaved,
}: {
  book: InventoryRow;
  onSaved: () => void;
}) {
  const [stock, setStock] = useState(String(book.inventory_count));
  const [priceRupees, setPriceRupees] = useState(
    String(Math.round(book.price_paise / 100)),
  );
  const [active, setActive] = useState(book.is_active);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newStock = parseInt(stock, 10);
    const newPricePaise = parseInt(priceRupees, 10) * 100;

    if (!Number.isFinite(newStock) || newStock < 0) {
      toast.error("Stock must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(newPricePaise) || newPricePaise < 0) {
      toast.error("Price must be a non-negative number.");
      return;
    }

    startTransition(async () => {
      const ops: Array<Promise<{ success: boolean; error?: string }>> = [];
      if (newStock !== book.inventory_count) {
        ops.push(
          updateBookStock({ bookId: book.id, newCount: newStock, reason: reason || undefined }),
        );
      }
      if (newPricePaise !== book.price_paise) {
        ops.push(updateBookPrice({ bookId: book.id, pricePaise: newPricePaise }));
      }
      if (active !== book.is_active) {
        ops.push(updateBookActive({ bookId: book.id, isActive: active }));
      }
      if (ops.length === 0) {
        toast.message("Nothing changed.");
        return;
      }
      const results = await Promise.all(ops);
      const firstErr = results.find((r) => !r.success);
      if (firstErr) {
        toast.error(firstErr.error ?? "Save failed.");
        return;
      }
      toast.success("Saved.");
      onSaved();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={4}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Stock"
            description={`Current: ${book.inventory_count}`}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ""))}
              required
            />
          </FormField>
          <FormField label="Price (₹)" description={`Current: ${formatINR(book.price_paise)}`}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value.replace(/[^0-9]/g, ""))}
              required
            />
          </FormField>
        </div>

        <FormField
          label="Reason for stock change (optional)"
          description="Shows up in admin audit log. Helps explain restocks later."
        >
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Restocked 20 from printer"
            maxLength={200}
          />
        </FormField>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={active}
            onCheckedChange={(c) => setActive(Boolean(c))}
          />
          <div>
            <Label className="text-body font-medium">Listed on storefront</Label>
            <p className="text-caption text-muted-foreground">
              Uncheck to hide this book from /store, /ibdp, /igcse. Existing
              orders are unaffected.
            </p>
          </div>
        </label>

        <Row gap={2} className="pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            <Check className="size-4" aria-hidden="true" />
            Save changes
          </Button>
        </Row>
      </Stack>
    </form>
  );
}
