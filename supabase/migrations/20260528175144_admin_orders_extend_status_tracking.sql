-- ============================================================================
-- Phase 5.1 · Admin orders UI — extend order_status + add tracking fields
--
-- The existing enum covers the happy path (paid → packed → shipped →
-- delivered → cancelled/refunded). Mom asked for:
--   - on_hold        — out of stock / awaiting verification
--   - partially_refunded — partial refund without ending the order lifecycle
--
-- Plus the orders table only has a free-text `tracking_url`. The detail
-- UI needs a structured (tracking_number, courier_name) pair so we can
-- render an actual "Shiprocket #XXXX" badge and (later) auto-fill from
-- the Shiprocket API. delivered_at + on_hold_at + refunded_at round out
-- the status timeline.
--
-- All status mutations go through the `update_order_status` SECURITY
-- DEFINER RPC below, which:
--   - re-checks the caller is_admin() (defense-in-depth on top of the
--     middleware gate + service-role server actions)
--   - stamps the matching `*_at` timestamp
--   - writes an admin_audit_logs row so every status flip is traceable
-- ============================================================================

-- Extend the enum. Postgres can't drop enum values without rebuilding,
-- so we only add — never remove existing values.
alter type public.order_status add value if not exists 'on_hold';
alter type public.order_status add value if not exists 'partially_refunded';

-- New columns. Keep tracking_url for backwards compat (it's already
-- referenced in /order/[id]/success); the structured pair below
-- supersedes it for new code.
alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists courier_name text,
  add column if not exists delivered_at timestamptz,
  add column if not exists on_hold_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists admin_notes text;

create index if not exists orders_tracking_number_idx
  on public.orders (tracking_number)
  where tracking_number is not null;

-- ---------------------------------------------------------------------------
-- update_order_status — single source of truth for status transitions.
--
-- Validates the target status, stamps the matching timestamp, and writes
-- an audit log entry. Rejects non-admin callers.
--
-- Allowed transitions (NOT a strict state machine — Mom may need to
-- back-step in the real world, e.g. "I marked shipped by mistake"):
--   any → any (admin-only). We just stamp the appropriate *_at column.
-- ---------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status public.order_status,
  p_notes text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text;
  v_updated public.orders;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin';
  end if;

  select email into v_admin_email
  from auth.users where id = auth.uid();

  update public.orders
  set
    status = p_new_status,
    paid_at      = case when p_new_status = 'paid'      and paid_at      is null then now() else paid_at      end,
    packed_at    = case when p_new_status = 'packed'    and packed_at    is null then now() else packed_at    end,
    shipped_at   = case when p_new_status = 'shipped'   and shipped_at   is null then now() else shipped_at   end,
    delivered_at = case when p_new_status = 'delivered' and delivered_at is null then now() else delivered_at end,
    on_hold_at   = case when p_new_status = 'on_hold'   and on_hold_at   is null then now() else on_hold_at   end,
    refunded_at  = case when p_new_status in ('refunded', 'partially_refunded')
                          and refunded_at is null then now() else refunded_at end,
    admin_notes  = coalesce(p_notes, admin_notes)
  where id = p_order_id
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'order not found: %', p_order_id;
  end if;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'order.status_update', 'orders', p_order_id::text,
     jsonb_build_object(
       'new_status', p_new_status,
       'notes', p_notes
     ));

  return v_updated;
end;
$$;

grant execute on function public.update_order_status(uuid, public.order_status, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- set_order_tracking — capture Shiprocket tracking number + courier.
-- ---------------------------------------------------------------------------
create or replace function public.set_order_tracking(
  p_order_id uuid,
  p_tracking_number text,
  p_courier_name text,
  p_tracking_url text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text;
  v_updated public.orders;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin';
  end if;

  select email into v_admin_email
  from auth.users where id = auth.uid();

  update public.orders
  set
    tracking_number = nullif(trim(p_tracking_number), ''),
    courier_name    = nullif(trim(p_courier_name), ''),
    tracking_url    = nullif(trim(coalesce(p_tracking_url, '')), '')
  where id = p_order_id
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'order not found: %', p_order_id;
  end if;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'order.tracking_set', 'orders', p_order_id::text,
     jsonb_build_object(
       'tracking_number', p_tracking_number,
       'courier_name', p_courier_name,
       'tracking_url', p_tracking_url
     ));

  return v_updated;
end;
$$;

grant execute on function public.set_order_tracking(uuid, text, text, text)
  to authenticated;
