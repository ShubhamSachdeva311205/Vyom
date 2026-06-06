# 🌅 Wake-up checklist — what to test today

Last session shipped four major chunks. Here's what to verify before
we start any new work.

## How to start everything back up

```bash
open -a Docker                              # wait for the whale icon to settle
./scripts/supabase-with-env.sh start        # ~1 min first time
pnpm dev                                    # then open http://localhost:3000
```

## What to test, in order

### 1. Phase 5.2 — Vendor coupons (`/admin/coupons`)
- [ ] Generator: discount % + vendor name + (optional expiry + multi-use) → **Generate code** → copy the VND-XXXX-XXXX
- [ ] Code shows up in the Vendor codes list with Active badge
- [ ] Paste it on `/checkout` as a normal customer → see the discount applied
- [ ] Single-use code: after one customer redeems, status flips to "Used up"
- [ ] Delete button works on unused codes; absent on used ones (audit trail)

### 2. Phase 3.4 — Refund UI (`/admin/orders/[id]`)
- [ ] Open any paid order → see new **Issue refund** button in Actions card
- [ ] Click → dialog shows original payment, fee (captured or "(est.)"), refundable now
- [ ] Try **Full** mode → "Customer gets X, Mom loses fee, Mom net-recoups Y"
- [ ] Try **Minus fee** → customer takes the ~2.36% hit
- [ ] Try **Custom** → enter an amount
- [ ] Try **Decline** → reason required, no money moves, audit log only
- [ ] After a successful refund: order status flips to refunded/partially_refunded, inventory increments back, audit log has two rows
- [ ] Check Razorpay test dashboard — refund appears under the payment

### 3. Phase 5.3 — Book CRUD (`/admin/inventory`)
- [ ] **Add new book** button at top opens an empty drawer
- [ ] Upload a cover (PNG/JPG/WebP, ≤5MB) → live preview updates
- [ ] Fill all fields → Save → toast success → book appears in list
- [ ] Visit `/store` → new book appears with your uploaded cover
- [ ] Click any row → drawer re-opens in edit mode with everything pre-filled
- [ ] Edit something → Save → reflects on `/store`
- [ ] Open one of Mom's existing 7 books → all fields pre-filled (Hindi fields blank, expected) → fill Hindi title/description → Save
- [ ] "Remove from catalogue" on a test book → soft-deletes → disappears from list + `/store`

### 4. Checkout no-refund acknowledgement (`/checkout`)
- [ ] Pay button is greyed out until you check the "I understand all sales are final" box
- [ ] Link in checkbox label opens `/legal/returns` in new tab
- [ ] Without the check: Pay disabled. With the check: Pay enabled (assuming other gates pass)

### 5. Name/phone inline validation (`/checkout`)
- [ ] Submit with empty name → red caption "Enter your full name." under the input (not the ugly Zen popover)
- [ ] Submit with bad phone → red caption under phone
- [ ] Fix the field → caption clears as you type

## If something is broken

Tell me in plain English. I'll pull the dev server logs to see exactly
what happened.

## Open issues that need your visual sign-off

These stay open until you say OK:

- **#82** — mobile hero responsiveness
- **#77** — receipt download (superseded by #83, but keep in review)
- **#78** — coupon multi-use + redeem-on-payment
- **#61** — admin orders UI
- **#83** — Vyapar invoice PDF layout
- **#64** — vendor coupon generator
- **#97** — admin refund UI
- **#101** — book CRUD
- **#103** — verify edit-existing flow for the seven seed books

## Big stuff queued for next session

- **#102 Phase 4** — Secure digital delivery (PDFs + audio + watermarking + access grants). Bigger build. You said placeholders first, real files later when R2 is set up. **Start with this when you're back.**
- **#100** — Forgot password flow
- **#87** — Shiprocket status webhook (auto-update order status)
- **#90** — Mobile responsiveness pass (P0 pre-launch)
- **#91** — Complete UI revamp (terraink.app aesthetic exploration)

## ⚠️ DO NOT FORGET

- **#99 — Delete the test60 coupon before launch.** It's a 60%-off code I seeded so we can exercise the checkout-safety slider. Marked P0.

Sleep well 💤 — see you in the morning.
