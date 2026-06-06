"use client";

import { useState, useTransition } from "react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  grantAccessManual,
  revokeAccessGrant,
  searchGrantsByEmail,
  type AdminGrantRow,
} from "@/actions/admin-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack, Row } from "@/components/layouts/stack";

interface BookOption {
  id: string;
  title: string;
  hasAudio: boolean;
  hasAnswerKey: boolean;
}

export function AccessManager({ books }: { books: BookOption[] }) {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<AdminGrantRow[] | null>(null);
  const [searching, startSearch] = useTransition();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startSearch(async () => {
      const result = await searchGrantsByEmail({ email });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setRows(result.data ?? []);
    });
  }

  return (
    <Stack gap={6}>
      {/* Manual grant */}
      <Card variant="surface" padding="lg">
        <Stack gap={3}>
          <Stack gap={1}>
            <span className="text-eyebrow">Grant access manually</span>
            <p className="text-caption text-muted-foreground">
              For offline / Amazon buyers. The customer must already have an
              account with this email.
            </p>
          </Stack>
          <GrantForm books={books} onGranted={() => rows !== null && setRows(null)} />
        </Stack>
      </Card>

      {/* Search */}
      <Card variant="surface" padding="lg">
        <Stack gap={3}>
          <span className="text-eyebrow">Find a customer&apos;s grants</span>
          <form onSubmit={onSearch}>
            <Row gap={2} align="end" className="flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <FormField label="Customer email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </FormField>
              </div>
              <Button type="submit" disabled={searching}>
                {searching ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="size-4" aria-hidden="true" />
                )}
                Search
              </Button>
            </Row>
          </form>

          {rows !== null ? (
            rows.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                No grants found for that email.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {rows.map((row) => (
                  <GrantRowItem
                    key={row.id}
                    row={row}
                    onRevoked={() =>
                      setRows((prev) =>
                        prev
                          ? prev.map((r) =>
                              r.id === row.id
                                ? { ...r, revokedAt: new Date().toISOString() }
                                : r,
                            )
                          : prev,
                      )
                    }
                  />
                ))}
              </ul>
            )
          ) : null}
        </Stack>
      </Card>
    </Stack>
  );
}

function GrantForm({
  books,
  onGranted,
}: {
  books: BookOption[];
  onGranted: () => void;
}) {
  const [email, setEmail] = useState("");
  const [bookId, setBookId] = useState("");
  const [contentKind, setContentKind] = useState<"audio" | "pdf">("pdf");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bookId) {
      toast.error("Pick a book.");
      return;
    }
    startTransition(async () => {
      const result = await grantAccessManual({
        email,
        bookId,
        contentKind,
        notes: notes || undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Access granted.");
      setEmail("");
      setNotes("");
      onGranted();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Stack gap={3}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Customer email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </FormField>
          <FormField label="Book">
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger><SelectValue placeholder="Pick a book" /></SelectTrigger>
              <SelectContent>
                {books.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Content">
            <Select
              value={contentKind}
              onValueChange={(v) => setContentKind(v as "audio" | "pdf")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">Answer key (PDF)</SelectItem>
                <SelectItem value="audio">Listening audio</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Note (optional)">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Amazon order #123"
              maxLength={300}
            />
          </FormField>
        </div>
        <Row>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="size-4" aria-hidden="true" />
            )}
            Grant access
          </Button>
        </Row>
      </Stack>
    </form>
  );
}

function GrantRowItem({
  row,
  onRevoked,
}: {
  row: AdminGrantRow;
  onRevoked: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const revoked = Boolean(row.revokedAt);

  function onRevoke() {
    if (!confirm(`Revoke ${row.contentKind} access to "${row.bookTitle}"?`)) return;
    startTransition(async () => {
      const result = await revokeAccessGrant({ grantId: row.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Access revoked.");
      onRevoked();
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
      <Stack gap={1} className="min-w-0">
        <Row gap={2} align="center" className="flex-wrap">
          <span className="text-sm font-medium truncate">{row.bookTitle}</span>
          <Badge variant="secondary">{row.contentKind === "pdf" ? "Answer key" : "Audio"}</Badge>
          <Badge variant="outline">{row.source}</Badge>
          {revoked ? <Badge variant="destructive">Revoked</Badge> : <Badge variant="success">Active</Badge>}
        </Row>
      </Stack>
      {!revoked ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          disabled={pending}
          aria-label="Revoke"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
    </li>
  );
}
