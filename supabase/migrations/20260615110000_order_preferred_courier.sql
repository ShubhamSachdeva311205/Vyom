-- ============================================================================
-- #85 · Let the customer pick a shipping partner at checkout
--
-- Stores the courier the customer chose (Shiprocket courier_company_id) so
-- autoCreateShiprocketOrder can pass it to /courier/assign/awb as the
-- preferred courier instead of letting Shiprocket auto-pick. Nullable —
-- when null we fall back to the cheapest available courier (today's behaviour).
-- ============================================================================
alter table public.orders
  add column if not exists preferred_courier_id integer;
