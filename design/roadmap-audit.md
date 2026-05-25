# Roadmap Audit · 2026-05-26

Where we are, what the original `roadmap.txt` is missing, where I think
the order is wrong, and what I'd add — written after finishing Phase 1.

---

## Snapshot

| Phase | Status |
|---|---|
| 0 — Foundation | ✅ done |
| 1.1 — Tokens & primitives | ✅ done |
| 1.2 — Shared UI components | ✅ done |
| 1.3 — Page shells & layouts | ✅ done |
| 2–8 | pending |

Phase 1 is fully done as written. Everything below this line is about
phases 2–8.

---

## What's missing (gaps)

These are real items the customer will need that aren't anywhere in
the current roadmap. Ranked by how blocking they are.

### Blocking — must add before Phase 2

1. **Cart state strategy.** The roadmap goes from inventory tables
   straight to Razorpay checkout, with no decision about where the
   cart lives. localStorage? A Supabase `carts` table? URL state? The
   choice affects auth flows, abandoned-cart emails, and SSR strategy.
   **Recommendation:** Server-backed cart (Supabase) tied to either
   user ID (logged in) or anonymous session cookie. Decision needed.

2. **Post-payment / order confirmation flow.** Razorpay returns the
   user to your site after success — where? The roadmap has the
   webhook but no `/order/[id]/success` page, no inline receipt, no
   "next steps" UX. This is the highest-friction moment in the funnel.

3. **Customer auth vs. admin auth.** Phase 2 says "Supabase Email and
   Google OAuth" but doesn't distinguish who's signing in. Admin (Mom)
   is one specific person — magic-link only is safer than password.
   Customers are public. Bundling them under one auth config invites
   privilege confusion. **Recommendation:** Separate flows; admin
   auth is a hard-coded email allowlist.

4. **404 + global error page.** Required by Next.js best practices
   and by basic dignity (CLAUDE.md §11 says empty states must never
   feel broken; same applies to errors). Phase 1.3 should have
   included these.

5. **Product content & images.** Phase 5.1 has "Inventory UI" but
   that's stock count, not the book content itself. Where do titles,
   descriptions, cover photos, sample pages come from? Who uploads
   them? What's the image pipeline (R2? Supabase Storage? next/image
   transforms)? This is a missing Phase 5.3 at minimum.

### Important — should fold in before launch

6. **Order status notifications.** Phase 7 mentions "shipping
   notifications" but order state has more transitions:
   `paid → packed → shipped → delivered (?)`. Each needs an email
   trigger. Probably also low-stock alerts to admin and weekly
   business summary.

7. **GST / tax for India.** Books in India have a specific GST
   exemption status. Razorpay payments need GST handling for
   non-exempt SKUs. The roadmap is silent.

8. **Refund / chargeback webhook.** Even with a strict no-returns
   policy, Razorpay can issue refunds and chargebacks. Webhook
   handlers and admin notifications must exist.

9. **Sitemap + robots.txt + OG images.** Storefront pages won't
   surface on Google without them. Currently only the metadata
   template is set.

10. **Analytics + error tracking.** Zero observability planned.
    Add PostHog (or Plausible) for product analytics; Sentry for
    runtime errors. Without these, when something breaks for a
    student in Hyderabad on 3G, you find out via support email
    instead of a dashboard.

11. **Accessibility verification.** CLAUDE.md mentions a11y goals
    but no audit step. At minimum: a keyboard-only walkthrough +
    `axe` scan before launch.

12. **Performance audit.** CLAUDE.md §9 sets a performance budget
    but no checkpoint to verify it. Lighthouse run + Core Web Vitals
    target should be a launch gate.

13. **Search / filtering on catalog.** A multi-curriculum, multi-
    subject catalog needs at least faceted filtering even if not
    text search. Not mentioned.

14. **Newsletter / waitlist signup.** Every reference site you cited
    (Mindspace, Superlist, matvoyce.tv) has one. The roadmap doesn't.

### Nice to have — explicit defer

- Wishlist, reviews/ratings, recommendations.
- Multi-language (English only ships at v1).
- Author/contributor profiles for the Creative Corner.
- Print-on-demand workflow for low-stock SKUs.

---

## Ordering observations

Two real ordering issues plus a few I think are fine.

1. **Phase 4 (R2 content delivery) before Phase 5 (admin tools).**
   This is backwards if admin is the one who needs to upload audio
   files and PDFs in the first place. Either: (a) interleave — build
   R2 upload tools in Phase 5 alongside the streaming/PDF viewer
   endpoints, or (b) accept that initial content is uploaded via the
   R2 dashboard manually for v1 and document that explicitly.
   **Recommendation:** (b) for v1. Admin upload UI can be a Phase 5.3
   item.

2. **Phase 7 (emails + deployment) bundled.** These are unrelated
   concerns on different cadences. Emails are transactional and tie
   to specific events across phases 3/5/6. Deployment is one-shot
   infrastructure work. **Recommendation:** Split: emails get folded
   into the phase they belong to (receipt in P3, status changes in
   P5, community digest in P6); deployment becomes its own short
   pre-launch phase.

3. **Subphase 1.3 listed "secure PDF viewer shell" as a Mode B
   shell.** I built every other shell in Phase 1.3 but skipped the
   PDF viewer because rendering logic belongs in Phase 4. The route
   shell at `/dashboard/read/[orderId]` (or wherever) can be a
   future stub. Flagging so we don't lose it.

What I think is fine in the original order:
- Phase 2 (DB + auth) → 3 (payments) → 4 (content) → 5 (admin) is
  the right dependency chain.
- Community (Phase 6) is late, but the storefront already has the
  `/community` shell pointing at "coming soon" disabled forms, so
  customers see a roadmap signal until then.
- Future scaling (Phase 8 Ollama) is correctly deferred.

---

## Risks

1. **Mom is the operator and likely the only one with admin access
   long-term.** That makes admin UX failures a single point of
   failure for the entire business. The mobile-first admin rule
   (CLAUDE.md §10) is good — it should be enforced via real device
   testing, not just responsive breakpoints. **Add an explicit
   admin-on-iPhone QA pass before launch.**

2. **Single-region deployment.** Vercel default is great for global
   edge but R2 + Supabase region choice will impact India latency.
   **Mumbai region for Supabase; R2 default global; verify p95
   latency from Bangalore + Delhi + Bangalore before launch.**

3. **No staging environment named.** "Deploy to Vercel" implies one
   environment. Need at minimum a `preview.advaita.in` for the QA
   pass on the production-shape pipeline before flipping DNS.

4. **No backup drill.** Supabase has automated backups; that doesn't
   mean restore actually works. Run one restore drill before launch.

5. **Razorpay test → live cutover.** Easy to leave test keys in prod
   by accident. Add an env-var validator (e.g., `RAZORPAY_KEY` must
   start with `rzp_live_` in production builds). Phase 3 work.

---

## Proposed revised structure

The minimum-viable update to `roadmap.txt`. I've applied this directly;
see `git diff` for the exact text.

```
Phase 0 — Foundation                                      [done]
Phase 1 — UI/UX Foundation                                [done]
  1.1 Tokens & primitives                                 [done]
  1.2 Shared UI components                                [done]
  1.3 Page shells & layouts                               [done]
  1.4 Hardening (NEW)                                     [next]
       • env-var validator (zod-env)
       • global error.tsx + not-found.tsx
       • sitemap.ts + robots.ts shells
       • metadata audit (OG images per route)

Phase 2 — Database & Auth
  Customer auth (Email + Google OAuth)
  Admin auth — separate magic-link-only flow, hardcoded
    allowlist (NEW emphasis)
  All existing tables
  Add: carts table (NEW)
  RLS

Phase 3 — Payments, Discounts, Shipping
  3.1 Razorpay
  3.2 Cart state + /cart + /order/[id]/success (NEW)
  3.3 Discounts
  3.4 Shipping logic + pincode
  3.5 Refund / chargeback webhook handling (NEW)
  3.6 GST + tax handling for non-exempt SKUs (NEW)

Phase 4 — Zero-exposure content delivery
  (No structural change)

Phase 5 — Admin Command Center
  5.1 Orders & Inventory
  5.2 Coupon tools + manual access grants
  5.3 Product CRUD + image upload (NEW)
  5.4 Customer lookup
  Mobile admin QA pass on a real phone (NEW)

Phase 6 — Community
  (No structural change)

Phase 7 — Transactional Emails (NEW — split)
  Receipts (interleaved into Phase 3 actually)
  Status-change notifications
  Admin alerts (low stock, vendor code created)
  Weekly business summary

Phase 8 — Polish & launch readiness (NEW)
  8.1 SEO: sitemap content, OG images, structured data
  8.2 Analytics: PostHog (or Plausible) + Sentry
  8.3 Accessibility: keyboard walkthrough + axe scan
  8.4 Performance: Lighthouse on every storefront route
  8.5 Backup restore drill

Phase 9 — Deployment (NEW — split from old Phase 7)
  Vercel production deploy + preview env
  Cloudflare DNS + rate limits on checkout/login/coupon
  Production env-var validation
  Razorpay test → live cutover checklist

Phase 10 — Future scaling
  Ollama chatbot via Cloudflare Tunnel
  Wishlist, reviews, recommendations
```

The shape is the same; what's new is mostly **splitting** Phase 7 into
its real concerns (emails, polish, deployment) and adding the four
items that were genuinely missing: cart, order confirmation, product
content management, observability.

---

## What I applied to `roadmap.txt`

- Added the four sub-items to Phase 1.4.
- Renamed Phase 2's auth bullet to call out customer-vs-admin.
- Added the `carts` table to Phase 2.
- Renumbered Phase 3 to include cart state, success page, refund
  webhook, GST.
- Added Phase 5.3 (product CRUD).
- Split old Phase 7 into Phases 7 (emails), 8 (polish), 9 (deployment).
- Renumbered "Future scaling" from 8 → 10.

## What I left for your approval

Bigger calls I didn't make unilaterally:

- **Cart state choice** (Supabase table vs. localStorage) — Phase 2
  needs this decision before the table goes in.
- **Whether to ship reviews/wishlist in v1** — currently parked in
  Phase 10; if v1 needs them, they bump up.
- **Newsletter provider** — Resend can send marketing too, but the
  list/segmentation tooling is weak; might want ConvertKit or
  Buttondown for marketing-only.
- **Whether to mirror digital-grant emails to a "manual override"
  spreadsheet** that Mom can edit offline as a backup. Belt-and-
  suspenders, useful for v1.
