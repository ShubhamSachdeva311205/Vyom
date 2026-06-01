-- ============================================================================
-- Phase 5.5 · Admin settings UI — seed default settings rows
--
-- The public.settings table already exists (from the FFR alignment
-- migration) and stores key→jsonb pairs. We seed four canonical rows
-- so the admin UI has defaults to render + the rest of the app has
-- a single source of truth for these values:
--
--   seller_details      → invoice header (name, address, phone, email, gstin)
--   shipping_settings   → free shipping toggle + threshold + pickup info
--   bank_details        → invoice footer bank block
--
-- The free_shipping_enabled row from the earlier migration is left in
-- place but is now superseded by shipping_settings.free_shipping_enabled.
-- A follow-up cleanup can drop it once nothing reads it.
-- ============================================================================

insert into public.settings (key, value) values
  (
    'seller_details',
    jsonb_build_object(
      'name', 'Seema Sachdeva',
      'address_lines', jsonb_build_array('Bengaluru, Karnataka', 'India'),
      'phone', '+91 99999 00000',
      'email', 'shubhamhelpseries@gmail.com',
      'gstin', null
    )
  )
on conflict (key) do nothing;

insert into public.settings (key, value) values
  (
    'shipping_settings',
    jsonb_build_object(
      'free_shipping_enabled', true,
      'free_shipping_threshold_paise', 10000,
      'pickup_pincode', null,
      'pickup_location', 'Primary'
    )
  )
on conflict (key) do nothing;

insert into public.settings (key, value) values
  (
    'bank_details',
    jsonb_build_object(
      'name', 'State Bank of India',
      'account_number', '***REDACTED***',
      'ifsc', '***REDACTED***',
      'branch', 'Marathahalli'
    )
  )
on conflict (key) do nothing;
