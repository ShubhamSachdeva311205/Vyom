-- Idempotency stamp so the order-confirmation email is sent exactly once,
-- even though both the webhook and the inline verify path call the sender.
alter table public.orders
  add column if not exists confirmation_email_sent_at timestamptz;
