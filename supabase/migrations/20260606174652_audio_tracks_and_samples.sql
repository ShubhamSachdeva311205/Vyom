-- ============================================================================
-- Phase 4 follow-up · Multi-track audio + book samples
--
-- Listening books ship with 20-30 audio tracks (one per question paper /
-- unit), not a single file — so audio needs its own child table. Samples
-- are short previews shown behind a "View sample" button (signed-in only).
--
-- Audio files live in Cloudflare R2 (free egress; see src/lib/r2). The
-- `bucket` column records where each track physically lives so the stream
-- route knows whether to read R2 or Supabase. Samples are small and live
-- in a private Supabase bucket.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- book_audio_tracks — one row per audio file. Grant is still per-book
-- (access_grants content_kind = 'audio'); tracks just enumerate the files.
-- ---------------------------------------------------------------------------
create table public.book_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  title text not null,
  -- Object key within the bucket.
  storage_key text not null,
  -- 'r2' (audio default) or 'supabase' (fallback for local testing).
  bucket text not null default 'r2',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index book_audio_tracks_book_idx
  on public.book_audio_tracks (book_id, sort_order);

alter table public.book_audio_tracks enable row level security;

-- Anyone signed-in can read the track LIST (titles + ids) — the bytes are
-- still gated by the grant check in the stream route. Admin writes.
create policy book_audio_tracks_select on public.book_audio_tracks
  for select using (true);
create policy book_audio_tracks_admin_all on public.book_audio_tracks
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- book_samples — preview files (PDF or images). Signed-in users only,
-- enforced in the /api/sample route.
-- ---------------------------------------------------------------------------
create type public.sample_kind as enum ('pdf', 'image');

create table public.book_samples (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  storage_key text not null,
  kind public.sample_kind not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index book_samples_book_idx on public.book_samples (book_id, sort_order);

alter table public.book_samples enable row level security;

-- Sample existence/metadata readable by anyone (so the storefront can show
-- the "View sample" button); the bytes are gated signed-in in the route.
create policy book_samples_select on public.book_samples
  for select using (true);
create policy book_samples_admin_all on public.book_samples
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private samples bucket (Supabase). Small files; no egress concern.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-samples', 'book-samples', false)
on conflict (id) do nothing;

drop policy if exists "book-samples admin write" on storage.objects;
create policy "book-samples admin write"
  on storage.objects for insert
  with check (bucket_id = 'book-samples' and public.is_admin());
drop policy if exists "book-samples admin modify" on storage.objects;
create policy "book-samples admin modify"
  on storage.objects for update
  using (bucket_id = 'book-samples' and public.is_admin());
drop policy if exists "book-samples admin delete" on storage.objects;
create policy "book-samples admin delete"
  on storage.objects for delete
  using (bucket_id = 'book-samples' and public.is_admin());
