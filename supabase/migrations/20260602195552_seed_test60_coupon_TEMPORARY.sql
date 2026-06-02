-- ============================================================================
-- TEMPORARY · Seed test60 coupon for exercising the checkout-safety slider.
--
-- ⚠️ DELETE BEFORE PRODUCTION LAUNCH. Tracked as a P1 issue with the
-- "remove-before-launch" label.
--
-- Why this exists: the admin /admin/settings "Checkout safety" floor
-- defaults to 30% (customer must pay >= 30% of subtotal). To verify the
-- floor actually triggers, we need a coupon that drops total below 30%.
-- The legit student10 / teacher10 codes are only 10% off, which can't
-- exercise the threshold. This seeds a 60% code.
--
-- Behaviour with default floor:
--   - 60% off on a single book → total = 40% of subtotal → ABOVE the 30%
--     floor → goes through normally.
--   - Drop the floor to 50% in /admin/settings → next test60 checkout
--     refuses (40% < 50%).
--   - Drop a book's free-shipping rule into the mix and the math gets
--     even closer — useful for stressing the rule.
-- ============================================================================

insert into public.coupons (code, type, discount_percent, max_uses, multi_use_per_user, notes)
values
  (
    'test60',
    'global',
    60,
    null,
    true,
    'TEMPORARY — testing the checkout-safety floor. Delete before launch.'
  )
on conflict (code) do nothing;
