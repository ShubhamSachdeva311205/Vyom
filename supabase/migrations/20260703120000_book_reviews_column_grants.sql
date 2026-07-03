-- ============================================================================
-- #108-class · Stop leaking book_reviews moderation columns to the public
--
-- book_reviews has a PUBLIC row policy (book_reviews_public_select_approved)
-- so anyone can read APPROVED reviews on a PDP. RLS is row-level only, so the
-- anon key can currently also pull moderator_notes / moderated_by / user_id
-- for every approved review:
--   GET /rest/v1/book_reviews?status=eq.approved&select=moderator_notes,user_id
--
-- Fix mirrors the audio/sample + content_submissions column-grant fixes
-- (migrations 20260611020728 / 20260626120000): keep the row policy public,
-- but REVOKE the table-wide SELECT and re-GRANT only the safe display columns.
-- The public read path (src/lib/queries/reviews.ts) selects exactly
-- id, reviewer_name, rating, title, body, created_at; admin moderation reads
-- go through the service-role client, which bypasses both RLS and column
-- grants, so nothing else is affected.
-- ============================================================================

revoke select on public.book_reviews from anon, authenticated;
grant  select (
         id, book_id, user_id, reviewer_name, rating, title, body, status, created_at
       )
  on public.book_reviews to anon, authenticated;
