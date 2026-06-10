-- ============================================================================
-- Security hardening sweep (audit 2026-06-11)
--
-- Closes:
--   #107 — privileged SECURITY DEFINER RPCs callable by anon over PostgREST
--   #108 — settings + audio-track/sample tables world-readable (bank PII +
--          storage keys leak to anon)
--   #109 — content_submissions / feedback anon INSERT with WITH CHECK(true)
--   #111 — refundOrder read-modify-write race (atomic reservation RPC)
--   #99  — remove the temporary test60 60%-off coupon
--
-- Root cause for #107: Postgres grants EXECUTE on every new function to
-- PUBLIC by default, and anon/authenticated are members of PUBLIC. The two
-- ungated definer RPCs (grant_digital_access, decrement_inventory) plus the
-- service-only RPCs (redeem_coupon, preview_coupon, next_invoice_number) were
-- therefore directly invokable at POST /rest/v1/rpc/<fn> with the public anon
-- key. All legitimate callers use the service-role client, so locking these to
-- service_role breaks nothing in the app.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- #107 · grant_digital_access — add a paid-order guard, lock to service_role.
-- (Re-created in full with the new guard; body otherwise unchanged.)
-- ---------------------------------------------------------------------------
create or replace function public.grant_digital_access(p_order_id uuid)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    return query select false, 'order_not_found';
    return;
  end if;
  -- Defense-in-depth: never grant access for an order that has not been paid.
  if v_order.status not in
       ('paid','packed','shipped','delivered','partially_refunded','refunded') then
    return query select false, 'order_not_paid';
    return;
  end if;
  if v_order.access_granted_at is not null then
    return query select false, 'already_done';
    return;
  end if;

  for v_item in
    select distinct oi.book_id
    from public.order_items oi
    join public.books b on b.id = oi.book_id
    where oi.order_id = p_order_id
      and (b.has_audio or b.has_answer_key)
  loop
    insert into public.access_grants (user_id, book_id, source, order_id)
    values (v_order.user_id, v_item.book_id, 'order', p_order_id)
    on conflict (user_id, book_id) do update set revoked_at = null;
  end loop;

  update public.orders set access_granted_at = now() where id = p_order_id;
  return query select true, 'ok'::text;
end;
$$;

revoke execute on function public.grant_digital_access(uuid) from public, anon, authenticated;
grant  execute on function public.grant_digital_access(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- #107 · decrement_inventory — add a paid-order guard, lock to service_role.
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
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    return query select false, 'order_not_found';
    return;
  end if;
  -- Defense-in-depth: only decrement stock for a paid order.
  if v_order.status not in
       ('paid','packed','shipped','delivered','partially_refunded','refunded') then
    return query select false, 'order_not_paid';
    return;
  end if;
  if v_order.inventory_decremented_at is not null then
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
    select inventory_count - v_item.total_qty into v_remaining
    from public.books
    where id = v_item.book_id
    for update;

    if v_remaining is null then
      return query select false, 'book_not_found';
      return;
    end if;
    if v_remaining < 0 then
      return query select false, 'insufficient_stock';
      return;
    end if;

    update public.books
    set inventory_count = v_remaining
    where id = v_item.book_id;
  end loop;

  update public.orders
  set inventory_decremented_at = now()
  where id = p_order_id;

  return query select true, 'ok'::text;
end;
$$;

revoke execute on function public.decrement_inventory(uuid) from public, anon, authenticated;
grant  execute on function public.decrement_inventory(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- #107 · Service-only RPCs — strip anon/authenticated/public, keep service_role.
-- (Signatures must match exactly for REVOKE to bind.)
-- ---------------------------------------------------------------------------
revoke execute on function public.redeem_coupon(text, uuid, uuid, integer)
  from public, anon, authenticated;
grant  execute on function public.redeem_coupon(text, uuid, uuid, integer)
  to service_role;

revoke execute on function public.preview_coupon(text, uuid, integer)
  from public, anon, authenticated;
grant  execute on function public.preview_coupon(text, uuid, integer)
  to service_role;

revoke execute on function public.next_invoice_number()
  from public, anon, authenticated;
grant  execute on function public.next_invoice_number()
  to service_role;

-- ---------------------------------------------------------------------------
-- #108 · settings — public read scoped to the three non-sensitive keys the
-- pre-auth storefront actually needs. Admin reads/writes stay covered by the
-- existing settings_admin_write FOR ALL policy. (bank_details / seller_details
-- are no longer anon-readable.)
-- ---------------------------------------------------------------------------
drop policy if exists settings_public_select on public.settings;
create policy settings_public_select on public.settings
  for select
  using (key in ('free_shipping_enabled', 'shipping_settings', 'checkout_safety'));

-- ---------------------------------------------------------------------------
-- #108 · audio tracks / samples — stop leaking storage_key/bucket to clients
-- while keeping the storefront's "has sample" badge working for logged-out
-- visitors (getSampleBookIds reads book_samples.book_id via the anon client).
-- RLS is row-level only, so we use column-level GRANTs: the row policy stays
-- public, but SELECT on storage_key/bucket is revoked from anon+authenticated.
-- The service-role streaming routes are unaffected (service_role bypasses
-- both RLS and column grants).
-- ---------------------------------------------------------------------------
-- Row policies stay public (badge needs book_id); recreate idempotently.
drop policy if exists book_audio_tracks_select on public.book_audio_tracks;
create policy book_audio_tracks_select on public.book_audio_tracks
  for select using (true);

drop policy if exists book_samples_select on public.book_samples;
create policy book_samples_select on public.book_samples
  for select using (true);

-- Strip the sensitive columns from the table-wide grant, then re-grant only
-- the safe columns to anon + authenticated.
revoke select on public.book_audio_tracks from anon, authenticated;
grant  select (id, book_id, title, sort_order, created_at)
  on public.book_audio_tracks to anon, authenticated;

revoke select on public.book_samples from anon, authenticated;
grant  select (id, book_id, kind, sort_order, created_at)
  on public.book_samples to anon, authenticated;

-- ---------------------------------------------------------------------------
-- #109 · content_submissions / feedback — replace the WITH CHECK(true) insert
-- policies so guests can only file PENDING rows, can't forge user_id, and
-- can't pre-set moderation/resolution columns.
-- ---------------------------------------------------------------------------
drop policy if exists content_submissions_anyone_insert on public.content_submissions;
create policy content_submissions_guest_insert on public.content_submissions
  for insert to anon
  with check (
    status = 'pending'
    and user_id is null
    and moderated_by is null
    and moderated_at is null
  );
create policy content_submissions_user_insert on public.content_submissions
  for insert to authenticated
  with check (
    status = 'pending'
    and user_id = auth.uid()
    and moderated_by is null
    and moderated_at is null
  );

drop policy if exists feedback_anyone_insert on public.feedback;
create policy feedback_guest_insert on public.feedback
  for insert to anon
  with check (resolved = false and resolved_by is null and user_id is null);
create policy feedback_user_insert on public.feedback
  for insert to authenticated
  with check (
    resolved = false
    and resolved_by is null
    and (user_id is null or user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- #111 · reserve_refund — atomic reservation to kill the refundOrder
-- read-modify-write race. The admin action calls this BEFORE hitting the
-- Razorpay API: it locks the order row, verifies the new cumulative refund
-- stays within total_paise, and stamps refunded_paise in the same statement.
-- Concurrent callers serialize on the row lock; the second one sees the
-- updated total and is rejected. If the subsequent Razorpay call fails, the
-- action calls release_refund to give the headroom back.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_refund(p_order_id uuid, p_amount_paise integer)
returns table (ok boolean, reason text, refunded_paise integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if p_amount_paise is null or p_amount_paise <= 0 then
    return query select false, 'invalid_amount', null::integer;
    return;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    return query select false, 'order_not_found', null::integer;
    return;
  end if;

  if coalesce(v_order.refunded_paise, 0) + p_amount_paise > v_order.total_paise then
    return query select false, 'exceeds_total', v_order.refunded_paise;
    return;
  end if;

  update public.orders
  set refunded_paise = coalesce(refunded_paise, 0) + p_amount_paise
  where id = p_order_id
  returning orders.refunded_paise into v_order.refunded_paise;

  return query select true, 'ok'::text, v_order.refunded_paise;
end;
$$;

revoke execute on function public.reserve_refund(uuid, integer) from public, anon, authenticated;
grant  execute on function public.reserve_refund(uuid, integer) to service_role;

create or replace function public.release_refund(p_order_id uuid, p_amount_paise integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set refunded_paise = greatest(coalesce(refunded_paise, 0) - p_amount_paise, 0)
  where id = p_order_id;
end;
$$;

revoke execute on function public.release_refund(uuid, integer) from public, anon, authenticated;
grant  execute on function public.release_refund(uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- #99 · Remove the temporary test60 60%-off coupon. The deleteCoupon admin
-- action refuses built-in codes (created_by IS NULL), so this MUST be a
-- migration. Cascade clears any redemptions.
-- ---------------------------------------------------------------------------
delete from public.coupon_redemptions
  where coupon_id in (select id from public.coupons where code = 'test60');
delete from public.coupons where code = 'test60';
