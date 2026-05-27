-- Phase 3.1 · Coupon redemption RPC + seed global codes
--
-- Closes security audit (2026-05-27):
--   #6 — coupon enumeration via public SELECT
--   #7 — coupon redemption race condition
--
-- The RPC pair (preview_coupon + redeem_coupon) is the ONLY supported
-- read/write path for coupons going forward. Direct anonymous SELECT on
-- public.coupons is revoked.

-- ---------------------------------------------------------------------------
-- 1. Drop the public SELECT policy — closes audit #6.
--    Admin policy stays in place; redemption flows go through SECURITY
--    DEFINER RPCs that read the row with the elevated function role.
-- ---------------------------------------------------------------------------
drop policy if exists coupons_anon_select_non_expired on public.coupons;

-- ---------------------------------------------------------------------------
-- 2. preview_coupon — read-only check used by the checkout UI to show
--    the user what discount the code would apply BEFORE they click Pay.
--
--    Returns one row with (valid, discount_paise, reason). Reason is null
--    when valid=true.
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

  select exists(
    select 1 from public.coupon_redemptions
    where coupon_id = v_coupon.id and user_id = p_user_id
  ) into v_already_redeemed;

  if v_already_redeemed then
    return query select false, 0, 'You have already used this coupon'::text;
    return;
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
-- 3. redeem_coupon — atomic redemption used at Razorpay-order creation.
--    SELECT … FOR UPDATE locks the coupon row so two concurrent
--    redemptions of a single_use code can't both succeed. The UNIQUE
--    constraint on (coupon_id, user_id) catches double-redemption by the
--    same user even outside the lock.
--
--    The function INSERTs the redemption row and bumps uses_count in one
--    transaction (PL/pgSQL functions are implicit transactions).
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

  -- Lock the coupon row for the duration of this transaction.
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

  select exists(
    select 1 from public.coupon_redemptions
    where coupon_id = v_coupon.id and user_id = p_user_id
  ) into v_already_redeemed;

  if v_already_redeemed then
    return query select false, 0, 'You have already used this coupon'::text;
    return;
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

-- ---------------------------------------------------------------------------
-- 4. Seed the two global codes from FFR §A6 / §C6a. Both are 10% off,
--    multi-use (max_uses null), one-redemption-per-user enforced by the
--    UNIQUE(coupon_id, user_id) constraint on coupon_redemptions.
--
--    Skip if already present (re-running the migration after manual seed).
-- ---------------------------------------------------------------------------
insert into public.coupons (code, type, discount_percent, max_uses, notes)
values
  ('student10', 'global', 10, null, 'Global 10% off — students. One per user.'),
  ('teacher10', 'global', 10, null, 'Global 10% off — teachers. One per user.')
on conflict (code) do nothing;
