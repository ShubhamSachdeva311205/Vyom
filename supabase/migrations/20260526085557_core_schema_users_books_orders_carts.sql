-- ============================================================================
-- Phase 2.2 · Core schema: users, books, orders + order_items, carts +
-- cart_items. RLS enabled at the bottom with per-table policies.
--
-- Money is stored in paise (Indian rupee subunit, 1 INR = 100 paise) as
-- integer to avoid floating-point math. App layer formats for display.
--
-- All public-readable tables (books) are filtered through `published=true`
-- so unpublished drafts stay invisible without admin auth.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users — extends auth.users with role + verified flag
--
-- A row is inserted by trigger on auth.users insert. role defaults to
-- 'customer'; admin role is set out-of-band (via the ADMIN_EMAILS
-- allowlist in middleware, Phase 2.5).
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'customer',
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_email_idx on public.users (email);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Auto-create public.users row when an auth.users row appears.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email_confirmed_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Mirror email_confirmed_at back into public.users.
create or replace function public.handle_auth_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email_verified_at = new.email_confirmed_at
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row when (new.email_confirmed_at is not null)
  execute function public.handle_auth_user_confirmed();

-- ---------------------------------------------------------------------------
-- books — inventory + content metadata
-- ---------------------------------------------------------------------------
create type public.curriculum as enum ('ibdp', 'igcse', 'other');
create type public.book_format as enum ('physical', 'digital', 'bundle');
create type public.gst_class as enum ('exempt', 'gst_0', 'gst_5', 'gst_12', 'gst_18');

create table public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  author text,
  isbn text,
  curriculum public.curriculum not null,
  subject text,
  format public.book_format not null,
  -- Money in paise to dodge floating-point. INR 1 = 100 paise.
  price_paise integer not null check (price_paise >= 0),
  gst_class public.gst_class not null default 'exempt',
  inventory_count integer not null default 0 check (inventory_count >= 0),
  cover_image_url text,
  -- R2 keys (set by admin upload tool in Phase 5.3). Never exposed to client.
  audio_r2_key text,
  pdf_r2_key text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_curriculum_published_idx on public.books (curriculum, published);
create index books_slug_idx on public.books (slug);

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders — Razorpay-backed orders
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'pending_payment', 'paid', 'packed', 'shipped',
  'delivered', 'cancelled', 'refunded'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.users(id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  subtotal_paise integer not null check (subtotal_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  tax_paise integer not null default 0 check (tax_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  -- Razorpay identifiers — populated when order is created server-side
  -- and when payment.captured webhook fires.
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  shipping_address jsonb,
  shipping_pincode text,
  tracking_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items — snapshot of cart contents at order time
-- ---------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  -- Price + format snapshotted at order time so historical orders stay
  -- correct even if the book's price changes later.
  unit_price_paise integer not null check (unit_price_paise >= 0),
  format public.book_format not null,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_book_id_idx on public.order_items (book_id);

-- ---------------------------------------------------------------------------
-- carts — server-backed cart, tied to user OR anonymous session
--
-- Anonymous session id is a cookie set on first /cart access. When the
-- user signs in, the anonymous cart is merged into their user cart
-- (handled in Server Action; Phase 3.2).
-- ---------------------------------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  anonymous_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One of the two MUST be set; both can't be null.
  constraint cart_owner check (user_id is not null or anonymous_session_id is not null)
);

create unique index carts_user_id_unique on public.carts (user_id) where user_id is not null;
create unique index carts_anon_session_unique on public.carts (anonymous_session_id)
  where anonymous_session_id is not null;

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cart_items — one row per book per cart
-- ---------------------------------------------------------------------------
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, book_id)
);

create index cart_items_cart_id_idx on public.cart_items (cart_id);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS — every table opts in. Service role bypasses all policies.
-- ============================================================================

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- users policies
-- ---------------------------------------------------------------------------
create policy users_self_select on public.users
  for select using (auth.uid() = id);

create policy users_admin_select_all on public.users
  for select using (public.is_admin());

create policy users_self_update on public.users
  for update using (auth.uid() = id)
  with check (
    -- Customers can't elevate themselves to admin.
    role = (select role from public.users where id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- books policies — published books are public; admin sees all
-- ---------------------------------------------------------------------------
create policy books_public_select on public.books
  for select using (published = true);

create policy books_admin_all on public.books
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders policies — users see own; admin sees all
-- ---------------------------------------------------------------------------
create policy orders_owner_select on public.orders
  for select using (user_id = auth.uid());

create policy orders_admin_all on public.orders
  for all using (public.is_admin())
  with check (public.is_admin());

-- order_items: read via parent order; admin all
create policy order_items_owner_select on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy order_items_admin_all on public.order_items
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- carts policies — owner via user_id OR anonymous_session_id cookie
--
-- Anonymous carts are scoped by a session id set via current_setting()
-- before each request from Server Actions / middleware. Postgres reads
-- it via current_setting('app.anonymous_session_id', true) — the `true`
-- arg makes a missing setting return NULL instead of throwing.
-- ---------------------------------------------------------------------------
create policy carts_user_owner on public.carts
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy carts_anonymous_owner on public.carts
  for all using (
    anonymous_session_id is not null
    and anonymous_session_id = current_setting('app.anonymous_session_id', true)
  )
  with check (
    anonymous_session_id is not null
    and anonymous_session_id = current_setting('app.anonymous_session_id', true)
  );

create policy carts_admin_select on public.carts
  for select using (public.is_admin());

-- cart_items: scoped via parent cart
create policy cart_items_user_owner on public.cart_items
  for all using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy cart_items_anon_owner on public.cart_items
  for all using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and c.anonymous_session_id is not null
        and c.anonymous_session_id = current_setting('app.anonymous_session_id', true)
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id
        and c.anonymous_session_id is not null
        and c.anonymous_session_id = current_setting('app.anonymous_session_id', true)
    )
  );

create policy cart_items_admin_select on public.cart_items
  for select using (public.is_admin());
