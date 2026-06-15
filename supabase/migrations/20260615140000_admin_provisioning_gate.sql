-- ============================================================================
-- #75 · P0 — close the first-admin-takeover via stale ADMIN_EMAILS
--
-- Today an admin magic-link is issued to any address in the ADMIN_EMAILS env
-- var (isAdminEmail unions env + DB). A typo'd / leaked / attacker-controlled
-- address in that env → admin sign-in with no second factor.
--
-- This RPC is the stricter gate for ISSUING an admin sign-in link: the email
-- must be BOTH in the public.admin_emails table AND already a verified
-- auth.users account. So an env-only address (no DB row, no verified account)
-- can never receive an admin link. SECURITY DEFINER so it can read auth.users;
-- execute is locked to service_role only.
-- ============================================================================
create or replace function public.admin_email_is_provisioned(p_email text)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on lower(a.email) = lower(u.email)
    where lower(u.email) = lower(trim(p_email))
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.admin_email_is_provisioned(text) from public;
revoke all on function public.admin_email_is_provisioned(text) from anon;
revoke all on function public.admin_email_is_provisioned(text) from authenticated;
grant execute on function public.admin_email_is_provisioned(text) to service_role;
