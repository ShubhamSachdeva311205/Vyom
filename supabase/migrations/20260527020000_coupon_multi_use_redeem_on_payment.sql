-- Phase 3.1 follow-up · Coupon semantics fix (Issue #78)
--
-- Two changes the user asked for:
--   1. student10 + teacher10 are multi-use per user (not one-per-user).
--      Vendor single-use codes stay one-per-user (gated by max_uses=1
--      + the post-payment redeem path).
--   2. Coupons only "count as used" when payment succeeds — NOT at
--      pending-order creation. The redemption move is a code change
--      (checkout.ts); the SCHEMA change here just relaxes the
--      one-per-user lock so multi-use codes can be re-redeemed.
--
-- Also adds a coupon_code column to orders so verify-payment knows
-- which code to redeem after Razorpay confirms.

-- 1. Drop the one-per-user UNIQUE constraint. Re-enforcement happens
--    inside the RPC, conditional on coupons.multi_use_per_user.
alter table public.coupon_redemptions
  drop constraint if exists coupon_redemptions_coupon_id_user_id_key;

-- 2. Add the new column. Default false so existing single-use vendor
--    codes keep their one-per-user semantics.
alter table public.coupons
  add column if not exists multi_use_per_user boolean not null default false;

-- 3. Flag the two global codes as multi-use per user.
update public.coupons set multi_use_per_user = true
  where code in ('student10', 'teacher10');

-- 4. Track which coupon was applied on each order. nullable — most
--    orders won't carry one.
alter table public.orders
  add column if not exists coupon_code text;

-- ---------------------------------------------------------------------------
-- 5. Rewrite preview_coupon — skip the "already redeemed" check when the
--    coupon is multi_use_per_user.
-- ---------------------------------------------------------------------------
create or replace function public.preview_coupon(
  p_code text,
  p_user_id uuid,
  p_eligible_subtotal_paise integer
)
returns table(valid boolean, discount_paise integer, reason text)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_coupon record;
  v_already_redeemed boolean;
begin
  if p_eligible_subtotal_paise < 0 then
    return query select false, 0, 'Invalid subtotal'::text;
    return;
  end if;

  select * into v_coupon from public.coupons where code = p_code;
  if v_coupon.id is null then
    return query select false, 0, 'Coupon not found'::text;
    return;
  end if;

  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return query select false, 0, 'Coupon has expired'::text;
    return;
  end if;

  if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then
    return query select false, 0, 'Coupon already used'::text;
    return;
  end if;

  if not v_coupon.multi_use_per_user then
    select exists(
      select 1 from public.coupon_redemptions
      where coupon_id = v_coupon.id and user_id = p_user_id
    ) into v_already_redeemed;
    if v_already_redeemed then
      return query select false, 0, 'You have already used this coupon'::text;
      return;
    end if;
  end if;

  return query select
    true,
    (p_eligible_subtotal_paise * v_coupon.discount_percent) / 100,
    null::text;
end;
$$;

revoke all on function public.preview_coupon(text, uuid, integer) from public;
grant execute on function public.preview_coupon(text, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Rewrite redeem_coupon — same conditional skip for multi-use codes.
--    Still SELECT … FOR UPDATE so concurrent redemptions of the same
--    single-use code serialise correctly.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_coupon(
  p_code text,
  p_user_id uuid,
  p_order_id uuid,
  p_eligible_subtotal_paise integer
)
returns table(success boolean, discount_paise integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon record;
  v_already_redeemed boolean;
  v_discount integer;
begin
  if p_eligible_subtotal_paise < 0 then
    return query select false, 0, 'Invalid subtotal'::text;
    return;
  end if;

  select * into v_coupon from public.coupons where code = p_code for update;
  if v_coupon.id is null then
    return query select false, 0, 'Coupon not found'::text;
    return;
  end if;

  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return query select false, 0, 'Coupon has expired'::text;
    return;
  end if;

  if v_coupon.max_uses is not null and v_coupon.uses_count >= v_coupon.max_uses then
    return query select false, 0, 'Coupon already used'::text;
    return;
  end if;

  if not v_coupon.multi_use_per_user then
    select exists(
      select 1 from public.coupon_redemptions
      where coupon_id = v_coupon.id and user_id = p_user_id
    ) into v_already_redeemed;
    if v_already_redeemed then
      return query select false, 0, 'You have already used this coupon'::text;
      return;
    end if;
  end if;

  v_discount := (p_eligible_subtotal_paise * v_coupon.discount_percent) / 100;

  insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount_paise)
  values (v_coupon.id, p_user_id, p_order_id, v_discount);

  update public.coupons set uses_count = uses_count + 1 where id = v_coupon.id;

  return query select true, v_discount, null::text;
end;
$$;

revoke all on function public.redeem_coupon(text, uuid, uuid, integer) from public;
grant execute on function public.redeem_coupon(text, uuid, uuid, integer) to authenticated;
