-- ============================================================================
-- Phase 4 · Secure digital delivery — grant automation + private storage
--
-- NOTE: the access_grants TABLE already exists from Phase 2.3 (auxiliary
-- schema migration). It is per-(user, book) with an `access_source` enum
-- (order | amazon | manual | refund_revoked) and `unique (user_id, book_id)`.
-- A grant on a book unlocks ALL of that book's digital companions (audio +
-- answer-key) — there's no real case where you'd own the book but not its
-- companions. So we DON'T add a content_kind; we build on the existing
-- per-book model.
--
-- This migration adds:
--   - orders.access_granted_at idempotency stamp
--   - grant_digital_access(order)     auto-grant on paid order
--   - grant_access_manual(email,book) admin grant for offline/Amazon buyers
--   - revoke_access(grant)            admin soft-revoke
--   - private Supabase buckets book-audio + book-pdfs (audio later moves to
--     R2; the book_audio_tracks.bucket column records where each file lives)
-- ============================================================================

alter table public.orders
  add column if not exists access_granted_at timestamptz;

-- ---------------------------------------------------------------------------
-- grant_digital_access — auto-grant on a paid order.
-- One grant per distinct book that has audio and/or an answer key.
-- Idempotent via orders.access_granted_at; on-conflict reactivates a
-- previously revoked grant.
-- ---------------------------------------------------------------------------
create or replace function public.grant_digital_access(p_order_id uuid)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    return query select false, 'order_not_found';
    return;
  end if;
  if v_order.access_granted_at is not null then
    return query select false, 'already_done';
    return;
  end if;

  for v_item in
    select distinct oi.book_id
    from public.order_items oi
    join public.books b on b.id = oi.book_id
    where oi.order_id = p_order_id
      and (b.has_audio or b.has_answer_key)
  loop
    insert into public.access_grants (user_id, book_id, source, order_id)
    values (v_order.user_id, v_item.book_id, 'order', p_order_id)
    on conflict (user_id, book_id) do update set revoked_at = null;
  end loop;

  update public.orders set access_granted_at = now() where id = p_order_id;
  return query select true, 'ok'::text;
end;
$$;

grant execute on function public.grant_digital_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- grant_access_manual — admin grants a book's digital access to an email.
-- ---------------------------------------------------------------------------
create or replace function public.grant_access_manual(
  p_email text,
  p_book_id uuid,
  p_notes text default null
)
returns public.access_grants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_admin_email text;
  v_grant public.access_grants;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin';
  end if;

  select id into v_user_id from public.users where lower(email) = lower(p_email);
  if v_user_id is null then
    raise exception 'no account found for %', p_email;
  end if;

  select email into v_admin_email from auth.users where id = auth.uid();

  insert into public.access_grants (user_id, book_id, source, notes)
  values (v_user_id, p_book_id, 'manual', p_notes)
  on conflict (user_id, book_id) do update set revoked_at = null, notes = p_notes
  returning * into v_grant;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'access.grant_manual', 'access_grants', v_grant.id::text,
     jsonb_build_object('email', p_email, 'book_id', p_book_id));

  return v_grant;
end;
$$;

grant execute on function public.grant_access_manual(text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- revoke_access — admin soft-revoke.
-- ---------------------------------------------------------------------------
create or replace function public.revoke_access(p_grant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin';
  end if;
  select email into v_admin_email from auth.users where id = auth.uid();

  update public.access_grants set revoked_at = now(), source = 'refund_revoked'
  where id = p_grant_id;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'access.revoke', 'access_grants', p_grant_id::text, null);
end;
$$;

grant execute on function public.revoke_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage buckets. public=false → no anon read. All access flows
-- through the API routes via the service-role client.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-audio', 'book-audio', false), ('book-pdfs', 'book-pdfs', false)
on conflict (id) do nothing;

drop policy if exists "book-audio admin write" on storage.objects;
create policy "book-audio admin write" on storage.objects for insert
  with check (bucket_id = 'book-audio' and public.is_admin());
drop policy if exists "book-audio admin modify" on storage.objects;
create policy "book-audio admin modify" on storage.objects for update
  using (bucket_id = 'book-audio' and public.is_admin());
drop policy if exists "book-audio admin delete" on storage.objects;
create policy "book-audio admin delete" on storage.objects for delete
  using (bucket_id = 'book-audio' and public.is_admin());

drop policy if exists "book-pdfs admin write" on storage.objects;
create policy "book-pdfs admin write" on storage.objects for insert
  with check (bucket_id = 'book-pdfs' and public.is_admin());
drop policy if exists "book-pdfs admin modify" on storage.objects;
create policy "book-pdfs admin modify" on storage.objects for update
  using (bucket_id = 'book-pdfs' and public.is_admin());
drop policy if exists "book-pdfs admin delete" on storage.objects;
create policy "book-pdfs admin delete" on storage.objects for delete
  using (bucket_id = 'book-pdfs' and public.is_admin());
