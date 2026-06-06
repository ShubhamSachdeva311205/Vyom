-- ============================================================================
-- Phase 4 · Secure digital delivery — access grants + private storage
--
-- Customers who buy a book with companion audio / answer-key PDFs get an
-- access_grants row per content kind. Files live in PRIVATE Supabase
-- Storage buckets (no public read) and are only ever served through our
-- API routes (/api/stream-audio, /api/protected-pdf) after a grant check.
-- The raw storage URL never reaches the browser.
--
-- Reuses the existing books.audio_r2_key / pdf_r2_key columns as the
-- storage object paths (named "r2" historically; they now point at
-- Supabase Storage object keys instead — same role).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. content_kind enum + access_grants table
-- ---------------------------------------------------------------------------
create type public.content_kind as enum ('audio', 'pdf');
create type public.grant_source as enum ('purchase', 'manual', 'amazon');

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  content_kind public.content_kind not null,
  source public.grant_source not null default 'purchase',
  -- null for auto (purchase) grants; admin's user id for manual grants.
  granted_by uuid references public.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  granted_at timestamptz not null default now(),
  -- Soft revoke — keeps the audit trail. A revoked grant denies access.
  revoked_at timestamptz,
  notes text,
  -- One active grant per (user, book, content_kind). Partial unique
  -- index so a revoked grant can be re-granted later.
  constraint access_grants_unique unique (user_id, book_id, content_kind)
);

create index access_grants_user_idx on public.access_grants (user_id);
create index access_grants_book_idx on public.access_grants (book_id);

alter table public.access_grants enable row level security;

-- Owner can read their own grants. Admin reads all.
create policy access_grants_owner_select on public.access_grants
  for select using (user_id = auth.uid());
create policy access_grants_admin_all on public.access_grants
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Idempotency stamp on orders
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists access_granted_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. grant_digital_access — auto-grant on paid order.
--
-- For each book in the order that has audio / answer-key companions,
-- insert the matching access_grants rows for the buyer. Idempotent via
-- orders.access_granted_at. Safe to call from both the inline verify
-- and the webhook.
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
    select distinct oi.book_id, b.has_audio, b.has_answer_key
    from public.order_items oi
    join public.books b on b.id = oi.book_id
    where oi.order_id = p_order_id
  loop
    if v_item.has_audio then
      insert into public.access_grants (user_id, book_id, content_kind, source, order_id)
      values (v_order.user_id, v_item.book_id, 'audio', 'purchase', p_order_id)
      on conflict (user_id, book_id, content_kind)
        do update set revoked_at = null;  -- re-activate if previously revoked
    end if;
    if v_item.has_answer_key then
      insert into public.access_grants (user_id, book_id, content_kind, source, order_id)
      values (v_order.user_id, v_item.book_id, 'pdf', 'purchase', p_order_id)
      on conflict (user_id, book_id, content_kind)
        do update set revoked_at = null;
    end if;
  end loop;

  update public.orders set access_granted_at = now() where id = p_order_id;
  return query select true, 'ok'::text;
end;
$$;

grant execute on function public.grant_digital_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. grant_access_manual — admin grants access to any email (offline /
--    Amazon buyers). Resolves the email to a user_id; fails if no account.
-- ---------------------------------------------------------------------------
create or replace function public.grant_access_manual(
  p_email text,
  p_book_id uuid,
  p_content_kind public.content_kind,
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

  insert into public.access_grants
    (user_id, book_id, content_kind, source, granted_by, notes)
  values
    (v_user_id, p_book_id, p_content_kind, 'manual', auth.uid(), p_notes)
  on conflict (user_id, book_id, content_kind)
    do update set revoked_at = null, granted_by = auth.uid(), notes = p_notes
  returning * into v_grant;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'access.grant_manual', 'access_grants', v_grant.id::text,
     jsonb_build_object('email', p_email, 'book_id', p_book_id, 'content_kind', p_content_kind));

  return v_grant;
end;
$$;

grant execute on function public.grant_access_manual(text, uuid, public.content_kind, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 5. revoke_access — admin soft-revoke.
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

  update public.access_grants set revoked_at = now() where id = p_grant_id;

  insert into public.admin_audit_logs
    (admin_id, admin_email, action, target_table, target_id, details)
  values
    (auth.uid(), v_admin_email, 'access.revoke', 'access_grants', p_grant_id::text, null);
end;
$$;

grant execute on function public.revoke_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Private storage buckets. public = false → no anon read. All access
--    flows through our API routes via the service-role client.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-audio', 'book-audio', false), ('book-pdfs', 'book-pdfs', false)
on conflict (id) do nothing;

-- Admin-only write/update/delete. No SELECT policy at all → only the
-- service-role client (which bypasses RLS) can read, i.e. our API routes.
drop policy if exists "book-audio admin write" on storage.objects;
create policy "book-audio admin write"
  on storage.objects for insert
  with check (bucket_id = 'book-audio' and public.is_admin());
drop policy if exists "book-audio admin modify" on storage.objects;
create policy "book-audio admin modify"
  on storage.objects for update
  using (bucket_id = 'book-audio' and public.is_admin());
drop policy if exists "book-audio admin delete" on storage.objects;
create policy "book-audio admin delete"
  on storage.objects for delete
  using (bucket_id = 'book-audio' and public.is_admin());

drop policy if exists "book-pdfs admin write" on storage.objects;
create policy "book-pdfs admin write"
  on storage.objects for insert
  with check (bucket_id = 'book-pdfs' and public.is_admin());
drop policy if exists "book-pdfs admin modify" on storage.objects;
create policy "book-pdfs admin modify"
  on storage.objects for update
  using (bucket_id = 'book-pdfs' and public.is_admin());
drop policy if exists "book-pdfs admin delete" on storage.objects;
create policy "book-pdfs admin delete"
  on storage.objects for delete
  using (bucket_id = 'book-pdfs' and public.is_admin());
