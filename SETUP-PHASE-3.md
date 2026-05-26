# Phase 3 setup — Razorpay onboarding

What you (Shubham) need to do before the checkout flow can be tested
end-to-end locally. This is a one-time set of dashboard steps.

Time: ~15 minutes.

---

## 1. Create a Razorpay account

1. Go to https://razorpay.com/signup.
2. Sign up as a business account using `shubhamhelpseries@gmail.com`
   (the same email you use for ADMIN_EMAILS).
3. Skip the KYC for now — you don't need it to use test mode. KYC is
   required only when you flip to live mode (Phase 9 deploy).

---

## 2. Generate test API keys

1. After login, top-right toggle should already say **Test Mode**. If
   it says "Live", click it and switch.
2. Go to **Settings → API Keys**.
3. Click **Generate Test Key**. It will show:
   - `Key Id` — starts with `rzp_test_…`
   - `Key Secret` — a 24-char-ish string (shown only ONCE — copy it
     immediately).

Paste both into `.env.local`:

```env
RAZORPAY_KEY_ID=rzp_test_<paste>
RAZORPAY_KEY_SECRET=<paste>
```

---

## 3. Register a webhook

We'll set up the webhook now even though Razorpay can't actually
reach `localhost`. The local dev work uses captured payloads + HMAC
unit tests; the dashboard webhook is for the eventual live URL.

1. Go to **Settings → Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL**: paste `https://example.com/api/webhooks/razorpay`
   for now. We'll update it to the real Vercel URL during Phase 9
   deploy.
4. **Active Events** — check these three:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
5. **Secret**: Razorpay generates one for you. Copy it.
6. Save.

Paste the secret into `.env.local`:

```env
RAZORPAY_WEBHOOK_SECRET=<paste>
```

---

## 4. Restart Next.js dev so the new env vars are picked up

```bash
# In whatever terminal is running `pnpm dev` — kill it (Ctrl-C) and
# restart:
pnpm dev
```

(Supabase doesn't need restarting — it doesn't read Razorpay keys.)

---

## 5. Verify

I'll add a `pnpm verify:razorpay` script that pings Razorpay's
`/orders` endpoint with your key and prints success/fail. Run that
once after pasting to confirm both keys + secret are loaded.

---

## What I'm building in parallel

While you do steps 1-3, I'll be building (no Razorpay calls — pure
code work):

- Cart Server Actions (add / remove / update / merge anonymous)
- `/cart` page with line items + coupon entry
- Anonymous-session cookie wiring (so users can shop pre-signup)
- Coupon validation (student10 / teacher10 / dynamic vendor codes)
- Razorpay order-creation Server Action (no live call needed — uses
  the SDK against your keys when you paste them)
- `/api/webhooks/razorpay` route with HMAC verify (unit-tested
  against captured payloads from the Razorpay docs)
- `/order/[id]/success` confirmation page

You won't be blocked. The "Pay" button will go through Razorpay's
test mode the moment your keys land in `.env.local`.

---

## Going live (Phase 9 — for future-Shubham)

When we deploy to Vercel:

1. Complete Razorpay KYC (business PAN, bank account, etc.).
2. Switch dashboard to **Live Mode**.
3. Generate Live API keys (start with `rzp_live_`). Paste into Vercel
   production env vars. The env validator will REJECT a `rzp_test_`
   key in production (see `src/lib/env.ts:18`).
4. Update the webhook URL in Razorpay dashboard from the
   `example.com` placeholder to `https://advaita.in/api/webhooks/razorpay`.
5. Generate a NEW webhook secret (don't reuse test secret in prod).
6. Test with a ₹1 transaction end-to-end. This is the formal
   validation gate for live payments.

---

## Reference

- Razorpay docs: https://razorpay.com/docs/payments/
- Test card numbers: https://razorpay.com/docs/payments/payments/test-card-details/
- HMAC verify (their algo): https://razorpay.com/docs/webhooks/validate-test/

If a step is unclear, drop a screenshot in `review/` and tell me
which screen you're on.
