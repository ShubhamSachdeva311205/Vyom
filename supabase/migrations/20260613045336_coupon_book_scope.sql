-- Book-targeted discount codes (clearance). When book_id is set, the coupon's
-- discount applies only to that book's line items at checkout (the eligible
-- subtotal is computed book-scoped in checkout.ts). NULL = applies to the
-- whole cart, as before.
alter table public.coupons
  add column if not exists book_id uuid references public.books(id) on delete set null;

create index if not exists coupons_book_id_idx on public.coupons (book_id) where book_id is not null;
