-- ============================================================================
-- Coupon integrity fixes (audit 2026-07-03)
--
-- Three related fixes:
--   1. orders.coupon_eligible_paise — persist the eligible base a coupon's
--      discount was computed against (book-scoped for clearance codes) so the
--      post-payment redeem records the SAME discount the customer was charged,
--      instead of re-deriving it from the full subtotal (ledger drift, no money
--      impact). Written by createRazorpayOrder; read by both redeem paths
--      (verifyPaymentAndCompleteOrder + the Razorpay webhook).
--
--   2. coupon_redemptions UNIQUE(order_id) — one coupon redemption per order.
--      Both the inline-verify and webhook paths do a SELECT-then-redeem which
--      is not atomic across processes; under concurrency both could redeem and
--      double-increment coupons.uses_count. The unique constraint makes the
--      second INSERT fail with 23505 (its uses_count bump rolls back), and the
--      callers now treat 23505 as a no-op. The backing unique index also fixes
--      the previously-unindexed order_id FK (seq scan on every payment).
--
--   3. single_use_max_uses_is_one — the old CHECK evaluated to NULL (which a
--      CHECK treats as satisfied) when a single_use coupon had max_uses NULL,
--      so a single_use code with NULL max_uses slipped through and was treated
--      as unlimited by the RPC. Re-add the constraint with an explicit NOT NULL
--      guard.
-- ============================================================================

-- 1. Persist the coupon-eligible base per order (nullable; most orders carry
--    no coupon). Table-wide SELECT already covers the new column.
alter table public.orders
  add column if not exists coupon_eligible_paise integer
  check (coupon_eligible_paise is null or coupon_eligible_paise >= 0);

-- 2. One redemption per order. Defensively de-dupe first (keep the lowest id
--    per order_id) so the constraint can be added even if a pre-fix race left
--    a duplicate. The unique constraint creates the backing index on order_id.
delete from public.coupon_redemptions a
  using public.coupon_redemptions b
  where a.order_id = b.order_id
    and a.id > b.id;

alter table public.coupon_redemptions
  add constraint coupon_redemptions_order_id_key unique (order_id);

-- 3. single_use codes must have a concrete max_uses = 1. Normalize any stray
--    rows first (NULL / other), then re-add the constraint with a NOT NULL
--    guard so NULL can no longer bypass it.
update public.coupons
  set max_uses = 1
  where type = 'single_use' and max_uses is distinct from 1;

alter table public.coupons
  drop constraint if exists single_use_max_uses_is_one;

alter table public.coupons
  add constraint single_use_max_uses_is_one
  check (type = 'global' or (max_uses is not null and max_uses = 1));
