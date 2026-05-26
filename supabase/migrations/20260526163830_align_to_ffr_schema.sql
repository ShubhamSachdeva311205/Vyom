-- ============================================================================
-- Phase 2.7 · Align schema to FULL_FEATURE_REFERENCE.md
--
-- Decisions captured 2026-05-26 (see design/feature-reference-diff.md):
--   F1 — table name `users` stays (no rename to `profiles`).
--   F2 — drop book_format enum + columns; FFR has no digital-only or
--        bundle products. audio + answer keys are FREE support material
--        bundled with the physical book.
--   F3 — add per-book discount_eligible boolean (Books #5 and #7 are not
--        eligible for student10/teacher10). Drop coupon-side scoping.
--   F4 — drop Bangalore shipping rule, switch to Delhivery-quote-<₹100
--        + admin toggle (settings table).
--   F5 — add settings + admin_audit_logs + admin_emails tables.
--   F6 — keep gst_class column (verify GST with CA later).
--
-- Also resolves:
--   Issue #9 — admin role consistency. is_admin() now reads admin_emails
--               instead of users.role, so the env-vs-DB drift goes away.
--   Issue #10 — admin-managed admin allowlist. admin_emails is a DB table
--               admin can CRUD from the future /admin/settings/admins UI.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop the format enum + every column that depends on it.
--    (coupons.applies_to_format also references this enum.)
-- ---------------------------------------------------------------------------
alter table public.order_items drop column format;
alter table public.books drop column format;
alter table public.coupons drop column applies_to_format;
alter table public.coupons drop column applies_to_curriculum;
drop type public.book_format;

-- ---------------------------------------------------------------------------
-- 2. books — rename + new columns
-- ---------------------------------------------------------------------------
drop policy if exists books_public_select on public.books;
alter table public.books rename column published to is_active;
create policy books_public_select on public.books
  for select using (is_active = true);

alter table public.books
  add column has_audio boolean not null default false,
  add column has_answer_key boolean not null default false,
  add column discount_eligible boolean not null default true,
  add column compare_at_price_paise integer
    check (compare_at_price_paise is null or compare_at_price_paise >= 0),
  add column publisher text;

-- ---------------------------------------------------------------------------
-- 3. order_items — snapshot the post-coupon price too
-- ---------------------------------------------------------------------------
alter table public.order_items
  add column final_price_paise integer not null default 0
    check (final_price_paise >= 0);

-- (coupons.applies_to_curriculum + applies_to_format already dropped in
-- step 1 since they depended on the curriculum / book_format enums.)

-- ---------------------------------------------------------------------------
-- 5. settings table — platform toggles (free_shipping_enabled etc.)
-- ---------------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Seed: free shipping on by default.
insert into public.settings (key, value) values
  ('free_shipping_enabled', 'true'::jsonb);

alter table public.settings enable row level security;

-- Anyone can READ settings (cart/checkout needs to see free_shipping_enabled
-- before sign-in to compute estimates). Admin writes via the function below.
create policy settings_public_select on public.settings
  for select using (true);

-- Defer the admin write policy until is_admin() is rewritten (step 8 below).

-- ---------------------------------------------------------------------------
-- 6. admin_audit_logs — append-only log of every admin action
-- ---------------------------------------------------------------------------
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.users(id) on delete set null,
  admin_email text,
  action text not null,
  target_table text,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index admin_audit_logs_action_idx on public.admin_audit_logs (action);

alter table public.admin_audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- 7. admin_emails — admin allowlist as a DB table (resolves #9, enables #10)
-- ---------------------------------------------------------------------------
create table public.admin_emails (
  email text primary key check (length(email) > 3),
  added_by uuid references public.users(id) on delete set null,
  added_at timestamptz not null default now(),
  notes text
);

-- Seed with the canonical admin email. ADMIN_EMAILS env var stays as a
-- backup boot-time check in middleware; this table is the runtime source
-- of truth.
insert into public.admin_emails (email, notes) values
  ('shubhamhelpseries@gmail.com', 'Seeded from initial admin allowlist');

alter table public.admin_emails enable row level security;

-- ---------------------------------------------------------------------------
-- 8. Rewrite is_admin() to read admin_emails — resolves Issue #9
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_emails ae
    inner join auth.users u on lower(u.email) = lower(ae.email)
    where u.id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 9. Now that is_admin() reads admin_emails, attach the admin-write
--    policies on the new tables.
-- ---------------------------------------------------------------------------
create policy settings_admin_write on public.settings
  for all using (public.is_admin())
  with check (public.is_admin());

create policy admin_audit_logs_admin_select on public.admin_audit_logs
  for select using (public.is_admin());

create policy admin_audit_logs_admin_insert on public.admin_audit_logs
  for insert with check (public.is_admin());

-- No update/delete policy on admin_audit_logs — append-only audit trail.

create policy admin_emails_admin_all on public.admin_emails
  for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 10. users.role column is now decorative — kept for display labels but
--     no policy references it. Future migration can drop it if desired.
-- ---------------------------------------------------------------------------
-- (no-op; documented for clarity)
