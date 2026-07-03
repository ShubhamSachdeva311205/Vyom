-- ============================================================================
-- Bug hunt · Stop anon/customer from reading sensitive columns via PostgREST
--
-- Two column-leak bugs of the same class already fixed for audio/sample/
-- content_submissions/book_reviews:
--   • books has a public row policy (is_active=true) but table-wide SELECT, so
--     the anon key can read audio_r2_key / pdf_r2_key (R2 object keys) and
--     cost_paise (COGS) via ?select=*.
--   • orders has an owner row policy (user_id=auth.uid()) but table-wide SELECT,
--     so a signed-in customer can direct-query PostgREST for their own order's
--     admin_notes / notes / razorpay_signature (internal ops + HMAC).
--
-- Fix: keep the row policies, revoke table-wide SELECT, re-grant only the safe
-- columns. The app's storefront + admin bulk reads use the service-role client
-- (bypasses column grants); the paired code change swaps the few user/anon-
-- client `select('*')` reads to explicit safe columns.
-- ============================================================================

-- books: withhold audio_r2_key, pdf_r2_key, cost_paise
revoke select on public.books from anon, authenticated;
grant select (
  id, slug, title, subtitle, description, author, isbn, curriculum, subject,
  price_paise, gst_class, inventory_count, cover_image_url, is_active,
  created_at, updated_at, has_audio, has_answer_key, discount_eligible,
  compare_at_price_paise, publisher, weight_grams, length_cm, breadth_cm,
  height_cm, hsn_sac, deleted_at, title_hindi, subtitle_hindi, description_hindi
) on public.books to anon, authenticated;

-- orders: withhold admin_notes, notes, razorpay_signature
revoke select on public.orders from anon, authenticated;
grant select (
  id, order_number, user_id, status, subtotal_paise, discount_paise,
  shipping_paise, tax_paise, total_paise, razorpay_order_id, razorpay_payment_id,
  shipping_address, shipping_pincode, tracking_url, created_at, updated_at,
  paid_at, packed_at, shipped_at, coupon_code, tracking_number, courier_name,
  delivered_at, on_hold_at, refunded_at, invoice_number, invoice_generated_at,
  inventory_decremented_at, non_refundable_fee_paise, refunded_paise,
  inventory_restocked_at, access_granted_at, confirmation_email_sent_at,
  shipped_email_sent_at, delivered_email_sent_at, refund_email_sent_at,
  preferred_courier_id, coupon_eligible_paise
) on public.orders to anon, authenticated;
