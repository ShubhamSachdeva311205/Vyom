-- ============================================================================
-- #55 / #108-class · Stop leaking community authors' emails to the public
--
-- content_submissions has a PUBLIC row policy (content_submissions_public_
-- select_approved) so logged-out visitors can read APPROVED pieces for the
-- Creative Corner feed. RLS is row-level only, so today the anon key can also
-- pull submitter_email for every approved post:
--   GET /rest/v1/content_submissions?status=eq.approved&select=submitter_email
-- harvesting every approved author's email.
--
-- Fix mirrors the audio/sample storage_key column-grant fix (migration
-- 20260611020728): keep the row policy public, but REVOKE the table-wide
-- SELECT and re-GRANT only the safe display columns the public feed actually
-- needs (src/lib/queries/community.ts selects id, submitter_name, kind, title,
-- body, media, created_at). submitter_email + moderation columns are withheld.
--
-- Admin reads go through the service-role client, which bypasses both RLS and
-- column grants, so moderation (which needs submitter_email) is unaffected.
-- ============================================================================

revoke select on public.content_submissions from anon, authenticated;
grant  select (
         id, user_id, submitter_name, kind, title, body, media,
         status, created_at, updated_at
       )
  on public.content_submissions to anon, authenticated;

-- Defense-in-depth: feedback already blocks all anon/authenticated row reads
-- via RLS (feedback_admin_all is the only SELECT policy), but strip the PII
-- columns from the grant too so a future loosened policy can't leak them.
revoke select on public.feedback from anon, authenticated;
grant  select (id, user_id, kind, body, resolved, created_at)
  on public.feedback to anon, authenticated;
