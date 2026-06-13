-- ============================================================================
-- #89 · Mark-as-Shipped customer email
--
-- Idempotency stamp so the "your order has shipped" email is sent exactly
-- once, no matter whether the trigger is Mom flipping the status by hand or
-- the Shiprocket webhook (#87) flipping it to `shipped`. The send claims this
-- column atomically (update ... where shipped_email_sent_at is null), mirroring
-- confirmation_email_sent_at.
-- ============================================================================
alter table public.orders
  add column if not exists shipped_email_sent_at timestamptz;
