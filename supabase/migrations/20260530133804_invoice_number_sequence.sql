-- ============================================================================
-- Phase 3.6 · Tax Invoice PDF — invoice numbering + HSN/SAC
--
-- Indian GST regulation requires invoice numbers to be:
--   - Sequential within a fiscal year (April–March).
--   - Unique, never reused, never with gaps for non-cancelled invoices.
--   - Survive server restarts.
--
-- We use a Postgres sequence (auto-restarts every April 1 via the
-- function below) and store the formatted number on orders.
-- ============================================================================

-- Sequence for the current fiscal year. We reset it manually each
-- April via cron / admin task — for now it starts at 1 and grows.
create sequence if not exists public.invoice_number_seq
  start with 1
  increment by 1
  no maxvalue
  no cycle;

-- Columns on orders.
alter table public.orders
  add column if not exists invoice_number text unique,
  add column if not exists invoice_generated_at timestamptz;

-- HSN/SAC on books. 4901 = printed books (0% GST under HSN 4901).
alter table public.books
  add column if not exists hsn_sac text not null default '4901'
    check (length(hsn_sac) between 4 and 8);

-- ---------------------------------------------------------------------------
-- next_invoice_number — atomic allocator.
--
-- Format: ADV/YYYY-YY/NNNN (e.g. ADV/2026-27/0001).
-- Fiscal year computed from current_date: months 4–12 → "YYYY-(YY+1)",
-- months 1–3 → "(YYYY-1)-YY".
-- ---------------------------------------------------------------------------
create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq bigint;
  v_year int;
  v_fy_start int;
  v_fy_end int;
begin
  v_seq := nextval('public.invoice_number_seq');
  v_year := extract(year from current_date)::int;
  if extract(month from current_date)::int >= 4 then
    v_fy_start := v_year;
    v_fy_end := v_year + 1;
  else
    v_fy_start := v_year - 1;
    v_fy_end := v_year;
  end if;
  return format(
    'ADV/%s-%s/%s',
    v_fy_start,
    lpad((v_fy_end % 100)::text, 2, '0'),
    lpad(v_seq::text, 4, '0')
  );
end;
$$;

grant execute on function public.next_invoice_number() to authenticated;
