-- ============================================================================
-- #93 · Save shipping address on the user profile for checkout pre-fill
--
-- Repeat customers re-type the same address every checkout. We stash the
-- most-recently-used address (when they tick "save for next time") on their
-- profile and pre-fill the checkout form from it. Same jsonb shape as
-- orders.shipping_address.
-- ============================================================================
alter table public.users
  add column if not exists default_shipping_address jsonb;
