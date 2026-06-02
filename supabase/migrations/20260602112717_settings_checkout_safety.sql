-- ============================================================================
-- Phase 5.5 follow-up · Checkout-safety settings
--
-- Adds one row to public.settings:
--   checkout_safety → { min_payable_fraction: 0.30 }
--
-- Drives the price-floor circuit breaker in createRazorpayOrder.
-- Idempotent.
-- ============================================================================

insert into public.settings (key, value) values
  (
    'checkout_safety',
    jsonb_build_object('min_payable_fraction', 0.30)
  )
on conflict (key) do nothing;
