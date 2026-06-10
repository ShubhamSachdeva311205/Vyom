# Security Audit — Advaita / Mom's Business Platform

**Date:** 2026-06-11
**Auditor:** Pre-launch security review
**Codebase:** Next.js 16.2.6 (App Router) · Supabase (Postgres + Auth + Storage) · Razorpay · Shiprocket
**Fixes commit:** `1b2ec08` — "security: pre-launch hardening sweep (audit 2026-06-11)"
**Repo:** github.com/ShubhamSachdeva311205/Vyom

---

## 1. Executive summary

A full security and data-leak audit was run against the platform ahead of launch. It covered authentication, payments, coupons, digital-content delivery, every Server Action, the database schema + RLS policies, secrets/PII exposure, request-level config, and XSS/injection surfaces. Findings were validated by running real attack probes against the live local stack (`http://localhost:3000` + the Supabase PostgREST API), not just by reading code.

**Headline result:** the platform had **2 critical (P0)** issues that allowed a completely unauthenticated attacker to (a) unlock every paid digital product without paying and (b) sabotage inventory — plus a public-repo data leak of real bank details. All code-level issues were fixed, verified against the live server, and pushed. One issue (#106) requires an owner decision (repo visibility) to fully close.

| Severity | Found | Fixed & verified | Needs owner action |
|----------|-------|------------------|--------------------|
| P0 (critical) | 3 | 2 | 1 (#106 repo visibility) |
| P1 (high) | 6 | 6 | — |
| P2 (medium) | 4 | 4 | — |
| P3 / partial (carried) | several | tracked | #74, #75, #76 |

**10 GitHub issues** were filed (#106–#115) and 10 issues auto-closed via the fix commit (#78, #99, #107–#115).

---

## 2. What the audit was — scope & methodology

### Scope
- **AuthN / AuthZ:** sign-in, sign-up, OTP/magic-link, forgot/reset-password, admin gating, middleware, session cookies.
- **Money paths:** Razorpay order creation + webhook HMAC, checkout total recomputation, coupons (preview/redeem), refunds, invoices, inventory decrement.
- **Digital delivery:** `/api/stream-audio`, `/api/protected-pdf`, `/api/sample`, access grants, watermarking, private storage buckets.
- **Every Server Action** in `src/actions/` (50 actions enumerated).
- **Database:** all 16 migrations — RLS policies, SECURITY DEFINER functions, EXECUTE grants, triggers, check constraints, storage policies.
- **Secrets / PII:** hardcoded keys, bank/phone/customer data, `NEXT_PUBLIC_` misclassification, `server-only` guards, git-tracked artifacts, git history.
- **Config / infra:** security headers, CSRF, rate limiting, cookie flags, CORS, cache-control, dependency CVEs.
- **Injection:** XSS, SQLi, PostgREST filter injection, path traversal, SSRF, ReDoS, CSV/PDF injection.

### Methodology
1. **Static review** of the full source tree and migration set.
2. **Live attack probes** against the running app + Supabase API:
   - Security-header inspection
   - Open-redirect payloads on `/auth/callback`
   - Admin auth-bypass attempts (no session, forged JWT, `x-middleware-subrequest` CVE class)
   - Direct PostgREST RPC calls with the public anon key
   - Anon reads of sensitive tables
   - Rate-limit probing (burst sign-ins)
   - Static dot-file/secret exposure (`.env`, `.git`, CSVs)
3. **DB-level verification** of EXECUTE grants and policies via direct `psql`.
4. **Git-history scan** for committed secrets.
5. **`pnpm audit`** for dependency CVEs.

### Tooling
- Python `requests` probe battery (the in-repo `/security-audit` skill)
- `curl` against PostgREST `/rest/v1/rpc/*` and table endpoints
- `psql` (via the Supabase docker container) for grant/policy inspection
- `gh` CLI for issue management
- `tsc --noEmit` + `eslint` to validate fixes compile clean

---

## 3. What we found & fixed

### 🔴 P0-1 · Privileged RPCs callable by anyone, unauthenticated — *FIXED* (#107)
**Reproduced:** `POST /rest/v1/rpc/grant_digital_access` and `decrement_inventory` returned **HTTP 200 with the public anon key** — no login required.

**Root cause:** Postgres grants `EXECUTE` to `PUBLIC` by default, and Supabase's `anon`/`authenticated` roles inherit it. These `SECURITY DEFINER` functions had **no `is_admin()` gate and no paid-order check**.

**Impact:**
- *Free digital goods:* create an unpaid order → call `grant_digital_access(orderId)` → every audio track + answer-key PDF in that order unlocks in `/dashboard/library`. One account could drain the entire catalog and share it — without paying once.
- *Inventory sabotage / oversell:* call `decrement_inventory` on a self-made pending order → stock drops to zero, the storefront shows "sold out," and the real payment webhook later breaks on the idempotency stamp.
- *Coupon/invoice abuse:* `redeem_coupon`/`preview_coupon` accepted a client-controlled `p_user_id`; `next_invoice_number` could be advanced by anyone (breaks gap-free GST numbering).

**Fix:** New migration `20260611020728` revokes EXECUTE from `public, anon, authenticated` and grants only `service_role` on all five functions (the legitimate callers — webhook + verify action — use the service-role client, so nothing breaks). Added defensive `status IN ('paid', …)` guards inside `grant_digital_access` and `decrement_inventory`.

**Verified:** anon calls now return **401/404**.

---

### 🔴 P0-2 · Public repo exposes real bank account + phone — *PARTIALLY FIXED, owner action required* (#106)
**Found:** the repo is **PUBLIC**, with the real SBI account number + IFSC, owner phone, and (in an untracked but loose file) customer PII — committed in tracked files and still present in **git history**. *(The actual values are deliberately omitted from this report so it stays safe to commit.)*

**Fix done (commit `1b2ec08`):** `DEFAULT_BANK` and the migration seed replaced with empty placeholders (real values now entered only via `/admin/settings`); phone + bank line redacted in docs.

**Still required (owner decision):** the values remain in **git history** on a public repo. Make the repo **private** (zero data loss — keeps all commits/history/issues) and/or `git filter-repo` to purge history. Also delete the loose `razorpay_test_api_keys_*.csv` + `Sale_*.pdf` from the project folder. *Note: account number + IFSC is "receive-only" info — it enables social-engineering/phishing, not direct withdrawal.*

---

### 🟠 P1 · Sensitive tables world-readable via PostgREST — *FIXED* (#108)
**Reproduced:** anon `GET /rest/v1/settings?key=eq.bank_details` returned the bank JSON; anon `GET /rest/v1/book_audio_tracks?select=storage_key` returned every audio object key (violating CLAUDE.md §7 "URLs never exposed to client").

**Fix:** `settings` public SELECT scoped to the 3 non-sensitive keys (`free_shipping_enabled`, `shipping_settings`, `checkout_safety`); `storage_key`/`bucket` hidden via **column-level grants** (row policy stays public so the storefront "has sample" badge keeps working).

**Verified:** `bank_details` → `[]`; `storage_key` → `permission denied`; `book_id` badge query still works.

---

### 🟠 P1 · Community/feedback forged inserts — *FIXED* (#109)
Anon `INSERT` policies used `WITH CHECK (true)`, letting a guest post `status='approved'` content (instant public, zero moderation) and forge `user_id`/`moderated_by` (impersonation). Replaced with guest + authenticated policies that pin `status='pending'`, `user_id` null-or-`auth.uid()`, and null moderation columns. **Verified:** forged `approved` insert now blocked.

### 🟠 P1 · No rate limiting + admin OTP brute-force — *FIXED* (#110)
**Reproduced:** 10 sign-ins in 1.0s, all processed. The admin 6-digit OTP (1-hour validity, no captcha) was brute-forceable. Added an in-process per-IP token bucket (`src/lib/auth/rate-limit.ts`) on sign-in (8/min), sign-up (5/min), OTP (6 per 5 min **per email**), forgot-password (4/5min), admin-magic-link (5/5min). Cloudflare WAF remains the Phase-9 edge layer.

### 🟠 P1 · Security headers absent / `/admin` clickjacking — *FIXED* (#114)
No CSP/HSTS/X-Frame-Options etc. — `/admin` and `/checkout` were iframable. Added a global `headers()` block in `next.config.ts`: `X-Frame-Options: DENY`, `frame-ancestors 'none'`, scoped CSP (self + Razorpay + Supabase + pdf.js worker), HSTS, `nosniff`, Referrer-Policy, Permissions-Policy.

### 🟠 P1 · Webhook skipped coupon redemption — *FIXED* (#78)
If a customer closed the tab before inline verify ran, the webhook completed the order but **never redeemed the coupon** → single-use vendor codes stayed "unused" and were reusable. The webhook now redeems idempotently (guarded against double-redeem against the inline path).

### 🟠 P1 · `test60` 60%-off coupon live — *FIXED* (#99)
A permanent, unlimited, multi-use 60%-off code was seeded and present in the DB. Deleted via migration (`DELETE 1` confirmed). **Verified:** no longer in `coupons`.

---

### 🟡 P2 · Refund double-disburse race — *FIXED* (#111)
`refundOrder` did read-`refunded_paise` → call Razorpay → write — so two concurrent requests could both disburse. Added atomic `reserve_refund`/`release_refund` RPCs (`SELECT … FOR UPDATE`); the action reserves headroom *before* hitting Razorpay and releases it on failure.

### 🟡 P2 · Env validator fail-open on prod secrets — *FIXED* (#112)
`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_*` were all `.optional()` with a dead `productionOnly` helper, so a prod deploy missing them booted silently. Now **required when `VERCEL_ENV==='production'`**.

### 🟡 P2 · Error oracles, raw error leaks, missing `server-only` — *FIXED* (#113)
- Sign-in/OTP errors collapsed to one generic string (no account-enumeration oracle).
- Customer-facing raw `error.message` (checkout cancel) sanitized; real reason logged server-side.
- Added `import "server-only"` to `src/lib/shiprocket/client.ts` + `src/lib/supabase/server.ts` (carry secrets).
- Stopped logging the Razorpay response (payment_id/order_id/signature) to the browser console in production.

### 🟡 P2 · `/auth/callback` open-redirect hardening — *FIXED* (in #76 set)
Was safe (origin-concat neutralized `//evil.com`) but used a weak `startsWith("/")` guard. Now explicitly rejects `//` and `/\` prefixes, matching the sign-in/OAuth guards.

### Documentation · roadmap.txt drift — *FIXED* (#115)
Corrected 1 false-positive checkbox (per-route OG images — only a global one exists) and marked 6 stale-but-done items + the now-fixed 8.7 security items.

---

## 4. What we verified was already SOLID (no action needed)

The audit confirmed a number of controls are correctly implemented:

- **Razorpay HMAC** — both the webhook and inline verify use constant-time `crypto.timingSafeEqual` against the **raw** body before parsing; signature required; 503 if secret unset.
- **Server-side price recomputation** — `createRazorpayOrder` recomputes subtotal from DB prices, re-fetches shipping server-side, applies the discount via the server RPC, and sets the Razorpay amount server-side. The client cannot underpay. A `checkout_safety` floor rejects near-zero totals.
- **No IDOR on protected content** — `/api/stream-audio` + `/api/protected-pdf` verify the grant belongs to the cookie-verified `auth.getUser()` id and filter `revoked_at IS NULL`; grant ids are non-guessable UUIDs.
- **Private buckets** — `book-audio`/`book-pdfs`/`book-samples` are `public=false` with no read policy; bytes flow only through service-role routes; PDFs always watermarked (no un-watermarked path).
- **Invoice IDOR** — `/api/orders/[id]/invoice.pdf` enforces owner-OR-admin.
- **Admin defense-in-depth** — every admin Server Action independently calls `assertAdmin()` (DB-backed) before mutating; write RPCs re-check `is_admin()`.
- **No XSS sinks** — zero `dangerouslySetInnerHTML`/`eval`/`innerHTML`; React auto-escaping throughout; UGC forms are still "Coming soon" stubs.
- **No SQL injection** — all queries parameterized via supabase-js / named RPC params.
- **Next.js 16.2.6** — not affected by the `x-middleware-subrequest` middleware-bypass CVE class.
- **Coupon enumeration (old issue)** — the anon SELECT policy was already dropped; coupon race uses `SELECT … FOR UPDATE`.
- **No permissive CORS;** authenticated/PII routes set `Cache-Control: private, no-store`; `robots.ts`/`sitemap.ts` exclude admin/dashboard.
- **Git hygiene** — `.env.local`, key CSVs, and the sale PDF were never committed (gitignore working).

---

## 5. What's still open (tracked)

| Issue | Title | Why open |
|-------|-------|----------|
| **#106** | Public-repo PII | Needs owner decision: make repo private and/or rewrite history. Code is scrubbed. |
| **#74 / #75** | Admin gate / stale `ADMIN_EMAILS` | DB-backed now, but the env allowlist still **overrides** the DB and can't be revoked via the UI. Recommend: env as bootstrap-only (applies only when `admin_emails` is empty). |
| **#76** | Security umbrella | Remaining sub-items: cart cookie unsigned/no `__Host-` prefix; disposable-email canonicalization (Gmail dots/plus, punycode, mixed-script); service-role client in user-facing cart path → move to anon + RLS; Cloudflare WAF edge limits (Phase 9). |

### Lower-priority hardening noted but not yet done
- ~20 **admin-facing** raw `error.message` returns (low risk — admin-only) could be mapped to friendly strings.
- `getBookSamples` missing a UUID `safeParse` on `bookId` (no exploit — parameterized).
- Supabase auth cookies inherit `@supabase/ssr` defaults; recommend explicitly asserting `httpOnly/secure/sameSite`.
- `postcss < 8.5.10` moderate CVE (build-time only, transitive via `next`) — `pnpm audit` flagged it; fix by bumping `next` or a pnpm override.
- `minimum_password_length = 6` in `supabase/config.toml` vs the app's 8 — align the config floor.
- Enable Supabase captcha (Turnstile/hCaptcha) on OTP verify for production.

---

## 6. Future scope — what to re-test and when

### Re-run the live attack battery any time
The in-repo `/security-audit` skill replays the probe set. Run it after any change to auth, RLS, or payment code:
```
# ensure pnpm dev is up, then:
/security-audit
```
It checks headers, open redirect, admin bypass, SQLi, cart IDOR, disposable-email, rate-limit, and static-file exposure.

### Quick regression checks for THIS round's fixes
```bash
# All five privileged RPCs must reject the anon key (expect 401/404):
for fn in grant_digital_access decrement_inventory redeem_coupon preview_coupon next_invoice_number; do
  curl -s -o /dev/null -w "$fn %{http_code}\n" -X POST \
    "$SUPABASE_URL/rest/v1/rpc/$fn" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Content-Type: application/json" -d '{}'
done
# Bank details must NOT be anon-readable (expect []):
curl -s "$SUPABASE_URL/rest/v1/settings?key=eq.bank_details&select=value" -H "apikey: $ANON"
# storage_key must be denied (expect 42501):
curl -s "$SUPABASE_URL/rest/v1/book_audio_tracks?select=storage_key&limit=1" -H "apikey: $ANON"
```

### When new features land, re-test these surfaces
- **Phase 6 community/feedback UIs go live** → re-test stored-XSS-into-admin (a guest payload that fires when Mom opens `/admin`), spam/rate-limit, and the new RLS insert policies end-to-end.
- **Phase 7 Resend emails** → HTML/email injection via user-supplied names/addresses; mandate escaping from day one.
- **CSV/Excel exports (5.9)** → CSV formula injection (`=`/`+`/`-`/`@` prefixes in customer names).
- **R2 migration (#104)** → re-verify no signed URL leaks to the client; private bucket policies.
- **Google OAuth (Phase 7)** → re-test the `next`-param redirect guard and callback.

### Pre-launch / production-cutover security checklist
- [ ] Repo private (or history purged) — **#106**
- [ ] `ADMIN_EMAILS` env reduced to bootstrap-only — **#74/#75**
- [ ] Cloudflare WAF rate rules on `/checkout`, `/api/*`, login, coupon — **#76**
- [ ] Razorpay test→live key + webhook-secret cutover; ₹1 live test refund
- [ ] Rotate all dev secrets (Razorpay test keys, Shiprocket password → API user, R2 keys, Google secret)
- [ ] Verify prod env validator fails fast with a deliberately-missing key (#112 fix)
- [ ] Cart cookie: add `__Host-` prefix + HMAC (#76)
- [ ] Enable Supabase captcha on OTP; set `minimum_password_length = 8`
- [ ] Confirm security headers present in prod (header changes need a deploy/restart)
- [ ] Backup-restore drill incl. `access_grants` (roadmap 8.6)
- [ ] One external/professional pentest pass before public launch

### Deeper review areas a future/external audit could pursue
- **Authenticated pentest** with two real customer accounts (cross-tenant IDOR on every Server Action).
- **Load/abuse testing** of the CPU-heavy PDF watermark + invoice routes (DoS).
- **Penetration of the admin session lifecycle** (fixation, concurrent sessions, `secure_password_change`).
- **Supply-chain** — periodic `pnpm audit` in CI + Dependabot.
- **Logging/PII review** once observability (Sentry/PostHog, roadmap 8.2) is wired — ensure no PII in error payloads.

---

## 7. Issue index

| # | Severity | Title | Status |
|---|----------|-------|--------|
| 106 | P0 | Public repo exposes bank/phone/PII | OPEN (owner action) |
| 107 | P0 | Privileged RPCs anon-callable | CLOSED |
| 108 | P1 | Sensitive tables world-readable | CLOSED |
| 109 | P1 | Community/feedback forged inserts | CLOSED |
| 110 | P1 | No rate limiting + OTP brute-force | CLOSED |
| 114 | P1 | Security headers absent | CLOSED |
| 78  | P1 | Webhook coupon redemption | CLOSED |
| 99  | P1 | test60 coupon live | CLOSED |
| 111 | P2 | Refund double-disburse race | CLOSED |
| 112 | P2 | Env validator fail-open | CLOSED |
| 113 | P2 | Error oracle / raw errors / server-only | CLOSED |
| 115 | P2 | roadmap.txt drift | CLOSED |
| 74/75/76 | P1 | Admin gate + umbrella (carried) | OPEN (partial) |

*All fixes attributed to the repo owner. Verified against the live local stack on 2026-06-11.*
