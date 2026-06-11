"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { listAuditLogs, type AuditRow } from "@/actions/admin-audit";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack, Row } from "@/components/layouts/stack";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ALL = "__all__";

export function AuditList() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [action, setAction] = useState<string>(ALL);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    start(async () => {
      const r = await listAuditLogs({ action: action === ALL ? undefined : action, page });
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      setRows(r.data.rows);
      setActions(r.data.actions);
      setTotal(r.data.total);
      setLoaded(true);
    });
  }, [action, page]);

  const lastPage = Math.max(1, Math.ceil(total / 30));

  return (
    <Stack gap={4}>
      <Row gap={2} align="center" className="flex-wrap">
        <span className="text-caption text-muted-foreground">Filter by action</span>
        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
      </Row>

      {loaded && rows.length === 0 ? (
        <Card variant="surface" padding="none" className="overflow-hidden">
          <EmptyState
            icon={ScrollText}
            title="No audit entries"
            description="Admin actions (refunds, status changes, grants, restocks) will appear here."
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Card variant="surface" padding="lg">
                <Stack gap={2}>
                  <Row gap={2} align="center" justify="between" className="flex-wrap">
                    <Row gap={2} align="center" className="flex-wrap">
                      <Badge variant="outline">{r.action}</Badge>
                      {r.targetTable ? (
                        <span className="text-caption text-muted-foreground">
                          {r.targetTable}
                          {r.targetId ? ` · ${r.targetId.slice(0, 8)}` : ""}
                        </span>
                      ) : null}
                    </Row>
                    <span className="text-caption text-muted-foreground tabular-nums">
                      {fmt(r.createdAt)}
                    </span>
                  </Row>
                  <Row gap={2} align="center" className="text-caption text-muted-foreground">
                    <span>{r.adminEmail ?? "—"}</span>
                  </Row>
                  {r.details && Object.keys(r.details as object).length > 0 ? (
                    <pre className="text-caption text-muted-foreground bg-muted/40 rounded-md p-2 overflow-x-auto">
                      {JSON.stringify(r.details, null, 2)}
                    </pre>
                  ) : null}
                </Stack>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 ? (
        <Row gap={2} justify="between" align="center" className="text-sm">
          <span className="text-muted-foreground">
            Page {page} of {lastPage} · {total} entries
          </span>
          <Row gap={2}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-accent"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40 hover:bg-accent"
            >
              Next
            </button>
          </Row>
        </Row>
      ) : null}
    </Stack>
  );
}
