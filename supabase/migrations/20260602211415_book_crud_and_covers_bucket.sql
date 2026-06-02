-- ============================================================================
-- Phase 5.3 · Admin Book CRUD — extra columns + cover storage bucket
--
-- - books.deleted_at — soft delete. Storefront queries filter
--   deleted_at IS NULL; order_items keep referencing the row so
--   historical orders aren't orphaned.
-- - books.title_hindi / subtitle_hindi / description_hindi — bilingual
--   metadata that the PDP (Phase A5) will render side-by-side with
--   the English fields.
-- - Storage bucket 'book-covers' (public) with public-read + admin-write
--   policies on storage.objects. Avoids the public/book-covers/*.webp
--   filesystem hack that doesn't survive on Vercel's read-only fs.
-- ============================================================================

alter table public.books
  add column if not exists deleted_at timestamptz,
  add column if not exists title_hindi text,
  add column if not exists subtitle_hindi text,
  add column if not exists description_hindi text;

create index if not exists books_deleted_at_idx
  on public.books (deleted_at)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

-- Public read for cover images (storefront serves them).
drop policy if exists "book-covers public read" on storage.objects;
create policy "book-covers public read"
  on storage.objects for select
  using (bucket_id = 'book-covers');

-- Admin-only write. Service role bypasses RLS, so admin server actions
-- still work via createServiceClient regardless — this policy is a
-- defence-in-depth for any anon-key path that ever tried.
drop policy if exists "book-covers admin write" on storage.objects;
create policy "book-covers admin write"
  on storage.objects for insert
  with check (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "book-covers admin update" on storage.objects;
create policy "book-covers admin update"
  on storage.objects for update
  using (bucket_id = 'book-covers' and public.is_admin());

drop policy if exists "book-covers admin delete" on storage.objects;
create policy "book-covers admin delete"
  on storage.objects for delete
  using (bucket_id = 'book-covers' and public.is_admin());
