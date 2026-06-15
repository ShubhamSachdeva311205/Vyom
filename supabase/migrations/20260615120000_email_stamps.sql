-- ============================================================================
-- #69 · Transactional emails (Phase 7) — idempotency stamps
--
-- Two more "send exactly once" columns mirroring confirmation_email_sent_at
-- and shipped_email_sent_at:
--
--   * delivered_email_sent_at — the "your order was delivered" email, claimed
--     atomically by whichever path flips the order to `delivered` (Shiprocket
--     webhook or admin manual mark-as-delivered).
--   * refund_email_sent_at — the "your refund was issued" email, claimed by the
--     Razorpay refund webhook / refund action.
--
-- Both are claimed via `update ... where <col> is null` so concurrent callers
-- can't double-send.
-- ============================================================================
alter table public.orders
  add column if not exists delivered_email_sent_at timestamptz;

alter table public.orders
  add column if not exists refund_email_sent_at timestamptz;
