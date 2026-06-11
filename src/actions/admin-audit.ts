"use server";

/**
 * Admin audit-log reader (C10). Read-only view of admin_audit_logs so
 * Mom (or a future second admin) can see who did what — refunds, status
 * changes, grants, restocks, book edits. Append-only table; no mutations.
 */

import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not signed in." };
  if (!(await isAdminEmail(user.email))) return { ok: false, error: "Not authorised." };
  return { ok: true };
}

export interface AuditRow {
  id: string;
  adminEmail: string | null;
  action: string;
  targetTable: string | null;
  targetId: string | null;
  details: unknown;
  createdAt: string;
}

const input = z.object({
  action: z.string().trim().max(60).optional(),
  page: z.number().int().min(1).max(500).optional(),
});

const PAGE_SIZE = 30;

export async function listAuditLogs(
  raw: z.input<typeof input>,
): Promise<ActionResult<{ rows: AuditRow[]; page: number; total: number; actions: string[] }>> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Invalid filter." };
  const gate = await assertAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const { action, page = 1 } = parsed.data;
  const service = createServiceClient();

  let query = service
    .from("admin_audit_logs")
    .select("id, admin_email, action, target_table, target_id, details, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (action) query = query.eq("action", action);

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) return { success: false, error: error.message };

  // Distinct action list for the filter dropdown (cheap on small data).
  const { data: actionRows } = await service
    .from("admin_audit_logs")
    .select("action")
    .limit(1000);
  const actions = [...new Set((actionRows ?? []).map((r) => r.action))].sort();

  return {
    success: true,
    data: {
      rows: (data ?? []).map((r) => ({
        id: r.id,
        adminEmail: r.admin_email,
        action: r.action,
        targetTable: r.target_table,
        targetId: r.target_id,
        details: r.details,
        createdAt: r.created_at,
      })),
      page,
      total: count ?? 0,
      actions,
    },
  };
}
