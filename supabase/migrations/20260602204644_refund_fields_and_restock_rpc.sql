-- ============================================================================
-- Phase 3.4 + #97 · Refund fields + restock RPC
--
-- Three new columns on orders to support partial refunds + accurate
-- fee math, plus a SECURITY DEFINER RPC that re-increments inventory
-- when a refund clears.
--
-- - orders.non_refundable_fee_paise — captured from the payment.captured
--   webhook's payment.fee + payment.tax fields. Lets the refund dialog
--   show exact net-recoup numbers. Old orders stay null and fall back
--   to a ~2.36% estimate in the UI.
--
-- - orders.refunded_paise (default 0) — cumulative amount refunded across
--   one or more partial refunds. Drives status: 0 = unchanged, >0 and
--   < total = partially_refunded, = total = refunded.
--
-- - orders.inventory_restocked_at — idempotency stamp for restock_inventory.
--   Mirrors orders.inventory_decremented_at from migration 20260602113523.
-- ============================================================================

alter table public.orders
  add column if not exists non_refundable_fee_paise integer,
  add column if not exists refunded_paise integer not null default 0
    check (refunded_paise >= 0),
  add column if not exists inventory_restocked_at timestamptz;

-- ---------------------------------------------------------------------------
-- restock_inventory — admin-only re-increment for refunds.
--
-- Pairs with decrement_inventory. Only restocks if decrement_inventory
-- was previously called (inventory_decremented_at IS NOT NULL) AND
-- restock hasn't already happened (inventory_restocked_at IS NULL).
--
-- Both checks together make this safe for double-call from the refund
-- flow and any future webhook handler.
--
-- Returns (ok, reason) matching the decrement contract.
-- ---------------------------------------------------------------------------
create or replace function public.restock_inventory(p_order_id uuid)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    return query select false, 'order_not_found';
    return;
  end if;
  if v_order.inventory_decremented_at is null then
    -- Nothing to restock — stock was never taken in the first place.
    return query select false, 'never_decremented';
    return;
  end if;
  if v_order.inventory_restocked_at is not null then
    return query select false, 'already_done';
    return;
  end if;

  for v_item in
    select book_id, sum(quantity)::int as total_qty
    from public.order_items
    where order_id = p_order_id
    group by book_id
    order by book_id
  loop
    update public.books
    set inventory_count = inventory_count + v_item.total_qty
    where id = v_item.book_id;
  end loop;

  update public.orders
  set inventory_restocked_at = now()
  where id = p_order_id;

  return query select true, 'ok'::text;
end;
$$;

grant execute on function public.restock_inventory(uuid) to authenticated;
