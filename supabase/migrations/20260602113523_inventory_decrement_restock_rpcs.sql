-- ============================================================================
-- Phase 5.1 + 3.x · Atomic inventory decrement + admin restock
--
-- The books.inventory_count column has existed since the core schema, but
-- nothing in the app updates it. This migration adds:
--
--   1. orders.inventory_decremented_at — idempotency stamp so the
--      payment.captured webhook + the inline verify can both attempt the
--      decrement without ever double-counting on retries.
--
--   2. decrement_inventory(p_order_id) — SECURITY DEFINER RPC. For each
--      line in the order, locks the book row FOR UPDATE, then decrements
--      atomically. Fails the entire transaction if ANY line would push
--      stock below zero (so partial decrements never happen). Idempotent
--      via the *_at column above.
--
--   3. restock_book(p_book_id, p_new_count, p_reason) — SECURITY DEFINER
--      RPC used by the admin inventory UI. Sets stock to an absolute
--      value (not a delta), writes an admin_audit_logs row, and re-checks
--      is_admin() defense-in-depth.
-- ============================================================================

alter table public.orders
  add column if not exists inventory_decremented_at timestamptz;

-- ---------------------------------------------------------------------------
-- decrement_inventory — webhook + verifyPaymentAndCompleteOrder both
-- call this on payment success. Both safe to call multiple times.
--
-- Returns a discriminated row so callers can act on the result:
--   ok = true                — first call, stock decremented
--   ok = false, already_done  — already decremented; nothing to do
--   ok = false, insufficient  — at least one line couldn't be decremented;
--                               whole tx rolled back. Caller should
--                               flag the order for refund.
-- ---------------------------------------------------------------------------
create or replace function public.decrement_inventory(p_order_id uuid)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
  v_remaining integer;
begin
  -- Pull the order row.
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    return query select false, 'order_not_found';
    return;
  end if;

  -- Idempotency.
  if v_order.inventory_decremented_at is not null then
    return query select false, 'already_done';
    return;
  end if;

  -- Lock every distinct book in the order to prevent two concurrent
  -- payment.captured handlers racing on the same book.
  for v_item in
    select book_id, sum(quantity)::int as total_qty
    from public.order_items
    where order_id = p_order_id
    group by book_id
    order by book_id  -- deterministic order to avoid deadlocks
  loop
    -- FOR UPDATE acquires the row lock.
    select inventory_count - v_item.total_qty into v_remaining
    from public.books
    where id = v_item.book_id
    for update;

    if v_remaining is null then
      -- Book row vanished mid-tx. Roll back.
      return query select false, 'book_not_found';
      return;
    end if;
    if v_remaining < 0 then
      -- Not enough stock. Roll back everything via the implicit tx
      -- around this function.
      return query select false, 'insufficient_stock';
      return;
    end if;

    update public.books
    set inventory_count = v_remaining
    where id = v_item.book_id;
  end loop;

  -- Stamp the idempotency column.
  update public.orders
  set inventory_decremented_at = now()
  where id = p_order_id;

  return query select true, 'ok'::text;
end;
$$;

grant execute on function public.decrement_inventory(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- restock_book — admin-only absolute stock setter.
--
-- p_new_count is the FULL new stock value, not a delta. Writes audit log
-- with the delta so reports can reconstruct the history.
-- ---------------------------------------------------------------------------
create or replace function public.restock_book(
  p_book_id uuid,
  p_new_count integer,
  p_reason text default null
)
returns public.books
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text;
  v_old_count integer;
  v_updated public.books;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin';
  end if;
  if p_new_count < 0 then
    raise exception 'restock_book: count must be >= 0';
  end if;

  select email into v_admin_email from auth.users where id = auth.uid();

  select inventory_count into v_old_count from public.books where id = p_book_id;
  if v_old_count is null then
    raise exception 'restock_book: book not found';
  end if;

  update public.books
  set inventory_count = p_new_count
  where id = p_book_id
  returning * into v_updated;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'book.restock', 'books', p_book_id::text,
     jsonb_build_object(
       'old_count', v_old_count,
       'new_count', p_new_count,
       'delta', p_new_count - v_old_count,
       'reason', p_reason
     ));

  return v_updated;
end;
$$;

grant execute on function public.restock_book(uuid, integer, text) to authenticated;
