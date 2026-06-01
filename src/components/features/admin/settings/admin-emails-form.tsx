"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { addAdminEmail, removeAdminEmail } from "@/actions/admin-settings";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/layouts/stack";

export interface AdminEmailRow {
  email: string;
  added_at: string;
  notes: string | null;
}

export function AdminEmailsForm({
  initial,
  currentEmail,
}: {
  initial: AdminEmailRow[];
  currentEmail: string;
}) {
  const [rows, setRows] = useState(initial);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addAdminEmail({ email, notes: notes || undefined });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRows((prev) => [
        ...prev,
        { email: email.toLowerCase(), added_at: new Date().toISOString(), notes: notes || null },
      ]);
      setEmail("");
      setNotes("");
      toast.success("Admin added.");
    });
  }

  function onRemove(target: string) {
    if (target.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("You can't remove your own admin access.");
      return;
    }
    startTransition(async () => {
      const result = await removeAdminEmail({ email: target });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRows((prev) => prev.filter((r) => r.email !== target));
      toast.success("Admin removed.");
    });
  }

  return (
    <Stack gap={4}>
      {rows.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          No DB-managed admins yet. The env-var <code>ADMIN_EMAILS</code> still
          grants access as the bootstrap layer.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const isSelf = row.email.toLowerCase() === currentEmail.toLowerCase();
            return (
              <li
                key={row.email}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {row.email}
                    {isSelf ? (
                      <span className="ml-2 text-caption text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  {row.notes ? (
                    <p className="text-caption text-muted-foreground truncate">
                      {row.notes}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(row.email)}
                  disabled={isSelf || pending}
                  aria-label={`Remove ${row.email}`}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={onAdd} className="border-t border-border pt-4">
        <Stack gap={3}>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <FormField label="Add admin email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </FormField>
            <FormField label="Note (optional)">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mom's backup"
                maxLength={200}
              />
            </FormField>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              Add
            </Button>
          </div>
        </Stack>
      </form>
    </Stack>
  );
}
