-- ============================================================================
-- Back-in-stock notifications (#98). Visitors on a sold-out book leave their
-- email; the admin can see who's waiting (and, later, email them on restock).
-- Guest-friendly (no account). One request per (book, email).
-- ============================================================================
create table public.stock_notifications (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  email text not null,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (book_id, email)
);

create index stock_notifications_book_idx on public.stock_notifications (book_id);
create index stock_notifications_pending_idx on public.stock_notifications (book_id) where notified_at is null;

alter table public.stock_notifications enable row level security;

-- Guests/users may request a notification (cannot pre-set notified_at).
create policy stock_notifications_guest_insert on public.stock_notifications
  for insert to anon
  with check (notified_at is null and user_id is null);
create policy stock_notifications_user_insert on public.stock_notifications
  for insert to authenticated
  with check (notified_at is null and (user_id is null or user_id = auth.uid()));

-- Only admins read / manage the waitlist.
create policy stock_notifications_admin_all on public.stock_notifications
  for all using (public.is_admin()) with check (public.is_admin());
