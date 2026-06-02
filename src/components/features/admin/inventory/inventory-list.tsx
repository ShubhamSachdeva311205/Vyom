"use client";

import { useState } from "react";
import { Library, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stack, Row } from "@/components/layouts/stack";
import { formatINR } from "@/lib/format";
import { LOW_STOCK_THRESHOLD, type InventoryRow } from "@/lib/inventory/constants";
import { BookEditDrawer } from "./book-edit-drawer";

function stockBadge(count: number, isActive: boolean) {
  if (!isActive) {
    return <Badge variant="outline">Hidden</Badge>;
  }
  if (count === 0) {
    return <Badge variant="warning">Sold out</Badge>;
  }
  if (count < LOW_STOCK_THRESHOLD) {
    return <Badge variant="destructive">Low ({count})</Badge>;
  }
  return <Badge variant="success">{count} in stock</Badge>;
}

export function InventoryList({ rows }: { rows: InventoryRow[] }) {
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Row gap={2} justify="between" align="center" className="flex-wrap">
        <span className="text-caption text-muted-foreground">
          {rows.length} {rows.length === 1 ? "book" : "books"}
        </span>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add new book
        </Button>
      </Row>

      {rows.length === 0 ? (
        <Card variant="surface" padding="none" className="overflow-hidden">
          <EmptyState
            icon={Library}
            title="No books here"
            description="Switch tabs to see books in other states, or add a new title."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => setEditing(book)}
                className="block w-full text-left rounded-lg border border-border bg-card hover:bg-accent/40 transition-colors"
              >
                <div className="p-3 grid grid-cols-[48px_1fr_auto] gap-3 items-center">
                  <div className="size-12 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                    {book.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_image_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <Stack gap={1} className="min-w-0">
                    <Row gap={2} align="baseline" className="flex-wrap">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <span className="text-caption text-muted-foreground uppercase tracking-wide">
                        {book.curriculum}
                      </span>
                    </Row>
                    <Row gap={2} align="center" className="flex-wrap">
                      {stockBadge(book.inventory_count, book.is_active)}
                      <span className="text-caption text-muted-foreground tabular-nums">
                        {formatINR(book.price_paise)}
                      </span>
                    </Row>
                  </Stack>
                  <span className="text-caption text-muted-foreground">Edit →</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <BookEditDrawer
        book={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
      <BookEditDrawer
        book={null}
        createMode
        open={creating}
        onOpenChange={(open) => {
          if (!open) setCreating(false);
        }}
      />
    </>
  );
}
