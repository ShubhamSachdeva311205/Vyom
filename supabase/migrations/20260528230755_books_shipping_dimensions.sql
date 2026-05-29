-- ============================================================================
-- Phase 3.3 · Shiprocket — book shipping dimensions
--
-- Shiprocket's serviceability + order-create APIs require per-shipment
-- weight (grams) and dimensions (cm). At checkout we sum
-- `cart_items.quantity × books.weight_grams` to get the total parcel
-- weight; on order-create we send the per-line item dims.
--
-- Defaults are sized for a typical school study book (~300g, B5-ish
-- format, 2 cm thick). Mom can override per-book later via the admin
-- book CRUD (Phase 5.3) or via SQL.
-- ============================================================================

alter table public.books
  add column if not exists weight_grams integer not null default 300
    check (weight_grams > 0 and weight_grams <= 10000),
  add column if not exists length_cm numeric(5, 1) not null default 22.0
    check (length_cm > 0 and length_cm <= 200),
  add column if not exists breadth_cm numeric(5, 1) not null default 15.0
    check (breadth_cm > 0 and breadth_cm <= 200),
  add column if not exists height_cm numeric(5, 1) not null default 2.0
    check (height_cm > 0 and height_cm <= 200);
