-- ============================================================================
-- #26 · Treasure-hunt coupon — hidden on the 404 page
--
-- Instead of suggesting codes to customers, we hide working codes around the
-- site as easter eggs (owner's call). This seeds the first one: FOUNDIT10,
-- a 10% global multi-use code (matches student10/teacher10), surfaced as a
-- hidden reveal on the 404 page.
-- ============================================================================
insert into public.coupons (code, type, discount_percent, multi_use_per_user, excludes_amazon, notes)
values ('foundit10', 'global', 10, true, true, 'Easter-egg / treasure-hunt code hidden on the 404 page (#26).')
on conflict (code) do nothing;
