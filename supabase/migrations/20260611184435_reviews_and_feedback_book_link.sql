-- ============================================================================
-- Phase 6 · Community + product reviews/feedback
--
-- Adds:
--   - book_reviews     public star-rating reviews per book, moderated
--   - feedback.book_id link so per-product feedback can be tagged to a book
--
-- Moderation reuses the existing public.moderation_status enum
-- (pending | approved | rejected). RLS mirrors content_submissions:
-- guests may insert PENDING rows only; only APPROVED rows are public;
-- admins do everything. (Issues #55/#56/#66/#67.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- book_reviews
-- ---------------------------------------------------------------------------
create table public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  reviewer_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status public.moderation_status not null default 'pending',
  moderator_notes text,
  moderated_by uuid references public.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create index book_reviews_book_status_idx on public.book_reviews (book_id, status);
create index book_reviews_status_idx on public.book_reviews (status);
create index book_reviews_created_at_idx on public.book_reviews (created_at desc);

alter table public.book_reviews enable row level security;

-- Public can read only APPROVED reviews.
create policy book_reviews_public_select_approved on public.book_reviews
  for select using (status = 'approved');

-- A signed-in user can read their own review regardless of status.
create policy book_reviews_owner_select on public.book_reviews
  for select to authenticated using (user_id = auth.uid());

-- Guests submit PENDING reviews only; cannot forge user_id / moderation cols.
create policy book_reviews_guest_insert on public.book_reviews
  for insert to anon
  with check (
    status = 'pending'
    and user_id is null
    and moderated_by is null
    and moderated_at is null
  );

-- Authenticated users submit PENDING reviews tied to themselves (or anon).
create policy book_reviews_user_insert on public.book_reviews
  for insert to authenticated
  with check (
    status = 'pending'
    and (user_id is null or user_id = auth.uid())
    and moderated_by is null
    and moderated_at is null
  );

-- Admins do everything (read pending, approve/reject).
create policy book_reviews_admin_all on public.book_reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- feedback.book_id — tag a feedback entry to a specific book (per-PDP form).
-- Nullable: the general /community feedback line leaves it null.
-- ---------------------------------------------------------------------------
alter table public.feedback
  add column if not exists book_id uuid references public.books(id) on delete set null;

create index if not exists feedback_book_id_idx on public.feedback (book_id);
