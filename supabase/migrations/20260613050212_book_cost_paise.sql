-- Per-book cost (COGS) so the sales report can show net profit (Vyapar-style).
-- Default 0 = "not set yet"; admin enters the print/purchase cost per book.
alter table public.books
  add column if not exists cost_paise integer not null default 0
  check (cost_paise >= 0);
