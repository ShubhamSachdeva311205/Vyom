# Advaita — Session Handoff (2026-05-27)

This file is for the **next Claude Code instance**. Read it end-to-end
before touching any code. It captures decisions, conventions,
gotchas, and state that aren't obvious from `git log` or the file tree.

The earlier session is at ~99% context and being closed out. Pick up
from commit `e5fb59e` (HEAD of `main`).

---

## 1. Project at a glance

**Advaita** — premium study-resource e-commerce for IBDP and IGCSE
Hindi books. Built by/for Seema Sachdeva (mom of the user). The user
is **Shubham** — sole developer + product manager. Real catalogue of
**7 physical books**; audio + answer keys are FREE support material
bundled with the physical book (no digital-only or bundle SKUs).

### Stack
- Next.js 16 App Router + Turbopack
- TypeScript strict
- Tailwind v4 (CSS-first config in `globals.css`, no `tailwind.config.ts`)
- Framer Motion (Mode A storefront only)
- Supabase (local via Docker + CLI); 14 tables, all RLS-enabled
- shadcn-style primitives hand-authored under `src/components/ui/`
- pnpm, gh CLI, vercel pending

### Top-level layout
```
src/
  app/
    (storefront)/   — Mode A pages (Navbar + Footer + NoiseLayer)
    (operational)/  — Mode B pages (data-mode="operational", no mesh, no motion)
    (auth)/         — clean centred card layout for sign-in/sign-up
    auth/callback/  — OAuth code exchange route
    design-tokens/  — internal calibration page (NOT customer-facing)
  components/
    ui/             — Button, Card, Input, Mascot, etc.
    features/store/ — BookCard, LayeredBookHero, ScrollRevealHero, mascot-scenes, etc.
    layouts/        — Navbar, Footer, Container, Stack, ShellPage, etc.
  lib/
    supabase/       — client/server/middleware/types
    queries/        — getBooks, getAdminStats
    auth/           — disposable email blocklist, admin allowlist helper
    motion/         — tokens + primitives
    format.ts       — pure formatters (formatINR)
    env.ts          — zod env validator (throws at boot)
  middleware.ts     — Supabase JWT refresh + route protection
  styles/           — typography.css, backgrounds.css
  actions/          — auth.ts, admin-auth.ts (Server Actions)
supabase/           — config.toml, migrations/, seed.sql
scripts/            — process-book-covers.py, supabase-with-env.sh
book-covers/
  book-covers-raw/  — user-dropped originals + covers-map.txt (filename→slug)
public/book-covers/ — cropped fronts served as /book-covers/<slug>.webp
image-prompts/      — folders for Kling AI generation handoff
design/             — design-system-spec.md, roadmap-audit.md, feature-reference-diff.md
review/             — user's screenshot uploads (do NOT delete)
FULL_FEATURE_REFERENCE.md   — ground-truth spec (7-book catalogue, §A–§H)
roadmap.txt         — phased execution plan
BUILD-JOURNAL.md    — what-shipped-when, with errors + fixes captured
SETUP-PHASE-2.md    — Docker/Supabase/Google OAuth setup steps for the user
```

---

## 2. Phases

| Phase | Status | Notes |
|---|---|---|
| 0 — Foundation | ✅ done | repo + CLAUDE.md + design-system-spec.md |
| 1.1 — Tokens & primitives | ✅ done | |
| 1.2 — Shared UI components | ✅ done | all form + state + overlay primitives |
| 1.3 — Page shells | ✅ done | route groups, all 14 routes prerender |
| 1.4 — Hardening | ✅ done | env validator, error/404, sitemap, OG image |
| 1.5 — Mascot expansion + cover infra | ✅ done | 6 mascots; OCR script + manual map |
| 1.6 — Storefront hero | 🟡 in progress | scroll-reveal + layered hero + curriculum tabs + /store |
| 2 — Database & Auth | ✅ done | 14 tables, customer + admin auth, middleware |
| 3 — Payments, Discounts, Shipping | ⏳ not started | next big phase |
| 4 — R2 + watermarked PDF + audio | ⏳ pending | |
| 5 — Admin command center | ⏳ pending | |
| 6 — Community | ⏳ pending | |
| 7 — Transactional emails (Resend) | ⏳ pending | |
| 8 — Polish & launch readiness | ⏳ pending | SEO, analytics, a11y, perf, backup drill |
| 9 — Deployment (Vercel + Cloudflare) | ⏳ pending | |
| 10 — Future scaling | ⏳ deferred | Ollama chatbot, etc. |

See `roadmap.txt` for the full sub-phase list.

---

## 3. The 7-book catalogue (FFR §G)

| Slug | Title | Price (paise) | discount_eligible | has_audio | has_answer_key |
|---|---|---|---|---|---|
| `ibdp-hindi-b-hl-reading` | IBDP Hindi B HL — Reading | 195000 | true | false | true |
| `ibdp-hindi-b-sl-reading` | IBDP Hindi B SL — Reading | 195000 | true | false | true |
| `ibdp-hindi-b-sl-io` | IBDP Hindi B SL-IO (Moukhik) | 105000 | true | false | false |
| `ibdp-hindi-b-hl-io` | IBDP Hindi B HL-IO (Moukhik) | 105000 | true | false | false |
| `ibdp-hindi-b-shravan-lekhan` | IBDP Shravan Lekhan (Listening) | 195000 | true | true | false |
| `igcse-hindi-paper-1` | IGCSE Hindi Paper 1 — Reading & Writing | 195000 | true | false | true |
| `igcse-hindi-paper-2-listening` | IGCSE Hindi Paper 2 — Listening | 199900 | true | true | false |

**Important business-rule overrides** (FFR §G says #5 + #7 are NOT
discount-eligible, but the user overrode 2026-05-27 → all 7 are
eligible). The seed reflects the override. If you regenerate the
seed, keep all `discount_eligible = true`.

The **homepage centerpiece** is **IGCSE Paper 1** (file (3) in the
raw covers — user picked this). The IBDP page centerpiece is
**IBDP Hindi B HL Reading**. The IGCSE page has Paper 1 centred,
Paper 2 to the right.

Real cover images live at `public/book-covers/<slug>.webp`. They
were extracted from combined front+back scans the user dropped in
`book-covers/book-covers-raw/` via
`scripts/process-book-covers.py`. The script supports both OCR
classification AND a manual `covers-map.txt` override file in the
raw folder. The OCR was unreliable on Devanagari + low-res
WhatsApp images, so the manual map is what got us the correct
mapping. Re-run the script if covers change.

---

## 4. The mascot system

`src/components/ui/mascot.tsx` exports a single `<Mascot />` component
with 6 characters. Each renders as an SVG blob with a gradient fill,
internal grain (feTurbulence), and a sleeping closed-eye face that
wakes up (eyes open + grin) on hover.

| Name | Silhouette | Hue | Accessory | Default coupon |
|---|---|---|---|---|
| `student` | round irregular | emerald | school collar + navy tie | `student10` |
| `teacher` | slightly oval | warm amber | rounded-rect glasses | `teacher10` |
| `bookworm` | tall capsule | violet-blue | round glasses | — |
| `wisp` | wide pebble | coral | — | — |
| `star` | 5-point star | gold | — | — |
| `triangle` | rounded triangle | teal | — | — |

### Key props
- `mood`: `"happy"` (default) or `"sad"`. Sad flips the smile to a
  frown AND tints accent accessories destructive-red (404 page uses
  `mascot="bookworm" mascotMood="sad"`).
- `withLimbs`: stick arms + legs + 3-finger hands. Only honoured by
  `student` and `teacher` (per Issue #18). Used in mascot scenes.
- `hideCoupon`: suppress the chip even if a default code exists.
- `size`: xs (36 px SVG) → sm (96 px) → md (160 px) → lg (224 px).

### Accessory colour separation
Hardware (band, frame, cup, cap, collar shape, glasses frame) ALWAYS
uses the `FACE_STROKE` constant. Accent dots (cap tassel, glasses
hinge, future LEDs) use `currentColor` which the SVG's `style.color`
toggles between `var(--brand)` (happy) and `var(--destructive)` (sad).

### Mascot scenes (in `src/components/features/store/mascot-scenes.tsx`)
- `<TeacherSittingOnBook />` — absolute-positioned at
  `bottom: calc(100% - 30px)` of its parent so it sits on the top
  edge of whatever it's inside.
- `<StudentHangingFromBook />` — absolute at
  `top: calc(100% - 24px)` so it dangles from the bottom.
- Both `size="sm"` so they read as on/around the book.
- Both rendered as **children of LayeredBookHero** which slots them
  inside the centre book's relative wrapper.
- On the homepage scroll-reveal these are intentionally REMOVED per
  user request 2026-05-27. They stay on /ibdp + /igcse.

### Bookworm reading scene
`src/components/features/store/bookworm-reading.tsx` — Mascot +
inline `OpenBookSVG`. The book renders **the back of an open book**
(spine + back covers in a V, page edges peeking at the bottom) so
the pages face the bookworm not the viewer. Animated bob + slow
rotation, respects `prefers-reduced-motion`. Used below the
homepage hero only.

---

## 5. The storefront hero system

Two components, both in `src/components/features/store/`:

### `LayeredBookHero` (static)
Used on `/ibdp` and `/igcse`. Centre book on top (size `xl`), side
books fan out behind (size `md`). Animation runs once on mount
(spring transition).

Each side card is wrapped in:
```tsx
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  <motion.div animate={{ x: offsetX, y, rotateY, scale }}>
    <BookCard ... />
  </motion.div>
</div>
```

The `inset-0 flex items-center justify-center` wrapper is the
**critical fix** for side books being visible. Without it, absolute
children default to (0,0) top-left and negative x offsets push them
off-screen. Don't break this pattern.

Current side-book params (commit `e5fb59e`):
- offsetX = direction * (260 + (depth-1) * 160)
- rotateY = direction * -22
- scale = 0.92 - depth * 0.05

### `ScrollRevealHero` (homepage)
- Sticky-container pattern: outer wrapper is `min-h-[300vh]`, inner
  is `sticky top-16 h-[calc(100vh-4rem)]`. As user scrolls, books
  stay in view while scroll progress drives the reveal.
- `useScroll({ target: ref, offset: ["start start", "end start"] })`
  → `useSpring({stiffness:120, damping:30, mass:0.4})` → derived
  `useTransform` for opacity + spread.
- **Two-stage reveal**: opacity 0→1 from 8-16% scroll (books appear
  at centre), spread 0→1 from 16-70% scroll (books fan outward).
  Don't recombine these — the user explicitly asked for "appear at
  centre, then fan out" not "fade in at final position".
- Mascots are NOT rendered here per user.

### BookCard sizes (`src/components/features/store/book-card.tsx`)
- sm: w-32 (128 px)
- md: w-48 (192 px) — used for side cards in heroes
- lg: w-72 (288 px) — used for /store grid + curriculum tabs
- xl: w-80 sm:w-96 lg:w-[28rem] (320–448 px) — centre book in heroes

### Hero card behaviour
- `asStatic={true}` → renders as `<div>`, no Link, NO hover zoom.
- `asStatic={false}` (default) → renders as Link to `/store/<slug>`
  with the hover zoom enabled.
- `showMeta={false}` → cover-only, no title/price/badge — used in
  heroes per user feedback ('looks hella cheap').

---

## 6. Workflow conventions (CRITICAL — read CLAUDE.md §13)

### GitHub Issues are the work tracker
- Every user-reported bug → `gh issue create` with the bug template.
- Every deferred feature → feature-request template.
- Every commit that resolves an issue references it with
  `Closes #N` in the message body. The `gh` CLI auto-closes
  matched issues on push.
- Templates live at `.github/ISSUE_TEMPLATE/`.
- Don't create blank issues — always use a template.
- `gh issue list --state open` is the first thing to check at the
  start of a session.

### Email identity (CLAUDE.md §14)
- `ai@gravity.fast` = Claude Code's git-config identity (commit
  attribution only). NEVER use as ADMIN_EMAILS, in OAuth consent
  screens, in customer copy, etc.
- `shubhamhelpseries@gmail.com` = the actual business owner email
  (Shubham's). Use this for ADMIN_EMAILS, Google Cloud Console
  consent screen, anywhere customer-facing.
- Fix on sight if you see `ai@gravity.fast` in any source/doc that
  isn't literal git commit attribution.

### BUILD-JOURNAL.md
- Update at the end of every meaningful work batch.
- Capture: what shipped, errors hit, lessons learned, commits.
- `Edit()` requires a prior `Read()` of the same file. **This has
  silently dropped journal updates multiple times.** Always Read
  before Edit; verify by checking the journal length / a specific
  word after.

### Roadmap
- `roadmap.txt` is the strategic long-range plan. Phase checkboxes
  get ticked as subphases land. Per-phase changes (new subphases,
  reorderings) get noted in `design/roadmap-audit.md`.

### Edit-before-Read trap (HUGE)
**Lesson learned multiple times this session**: when the harness
rejects an `Edit()` because the file wasn't read first, the message
goes by silently. The build keeps working because the OLD content
is still there. You think you made the change; you didn't. Multiple
commits have shipped with stale content this way.

**Defence:**
1. Always Read a file before editing it. Even if it seems obvious.
2. After any non-trivial Edit, **grep the file for the new content**
   to confirm it actually landed.
3. If a build is suspiciously short or status quo after a change you
   expected to be visible, suspect a phantom edit first.

---

## 7. Auth + admin

### Customer auth
- Sign up + sign in: Google OAuth (primary) + email/password
  (secondary).
- `enable_confirmations = true` in `supabase/config.toml` → email
  signup requires clicking the magic link OR pasting the 6-digit OTP
  (Inbucket in dev, Mailpit at `localhost:54324`).
- Disposable-email blocklist (`src/lib/auth/disposable.ts`):
  3-layer check — canonical 10k list + curated extras (westecom.com,
  etc.) + regex patterns (tempmail, temomail, throwaway, mailinator,
  etc.). The user's "smarty pants" rejection message is intentional
  copy.
- OTP entry: `VerifyOtpForm` component allows pasting the 6-digit
  code as an alternative to clicking the link.

### Admin auth
- Magic-link only. No password path for admin.
- `ADMIN_EMAILS` env var (comma-separated, no spaces). Currently
  just `shubhamhelpseries@gmail.com`.
- Middleware at `src/middleware.ts` reads `ADMIN_EMAILS` and gates
  `/admin/*` routes.
- DB-side: `public.admin_emails` table is the source of truth for
  the `is_admin()` SQL function. Phase 5.5 will build a UI to
  CRUD this table from /admin.
- Currently `is_admin()` reads `admin_emails ⨝ auth.users` (not
  `users.role`). So adding someone to `admin_emails` immediately
  promotes them. Adding them to ADMIN_EMAILS env still works as the
  middleware check.

### Supabase env wrapper (CRITICAL)
`scripts/supabase-with-env.sh` sources `.env.local` before exec'ing
supabase. The Supabase CLI doesn't auto-read .env.local (that's
Next.js convention). All `pnpm supabase:*` scripts use this wrapper.
If you bypass it (running `supabase` directly), config.toml env()
substitutions like `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` won't
resolve.

---

## 8. Open user-action items

These are blockers waiting on the user — call them out at the start
of any session.

| # | Item | What user needs to do |
|---|---|---|
| **#7** | Google OAuth `redirect_uri_mismatch` | In Google Cloud Console → APIs & Services → Credentials → click Advaita OAuth client → ensure `http://localhost:54321/auth/v1/callback` is in Authorized redirect URIs. Save. Then `pnpm supabase:stop && pnpm supabase:start`. |
| `.env.local` line 16 | `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=` is empty | Paste the rotated Google Client Secret on that line. Restart supabase. |

Until both are done, **Google sign-in fails with redirect_uri_mismatch**.
Email/password sign-up works.

---

## 9. Open GitHub issues (6, all deferred or pending user)

| # | Type | Title | Status |
|---|---|---|---|
| #2 | feature · P2 · phase/8 | Ambient brand decoration (floating books + scattered companions) | Deferred to Phase 8.5 |
| #3 | docs · P2 · phase/2 | Mailpit-vs-real-inbox confusion | Surface in SETUP-PHASE-2.md when convenient |
| #5 | bug · P3 · phase/8 | Disposable email scale (Kickbox API) | Deferred to Phase 8 |
| #7 | docs · P2 · phase/2 | Google OAuth `redirect_uri_mismatch` | User action in GCP |
| #10 | feature · P1 · phase/2 | Admin allowlist UI | DB layer done, UI = Phase 5.5 |
| #11 | feature · P3 · phase/8 | Theme switcher | Deferred to Phase 8 |

---

## 10. Known gotchas

| Pitfall | What to do |
|---|---|
| Edit before Read silently fails | Read first, grep after to verify. |
| Supabase CLI doesn't read .env.local | Use `./scripts/supabase-with-env.sh` (or `pnpm supabase:*` scripts). |
| `pnpm supabase:start` fails because secret blank | Tell user to paste in `.env.local`. |
| React 19 + Turbopack jankifies `React.Children.only` | Already replaced in FormField — don't add new `Children.only` calls. |
| `useTransform` doesn't accept union types | Always pass MotionValues; use `useMotionValue(1)` for reduced-motion constants. |
| Mascot SVG uses currentColor for ACCENT only | Don't swap to currentColor for hardware paths — those need FACE_STROKE always. |
| Tailwind v4 is CSS-first | Don't create `tailwind.config.ts`. All tokens live in `globals.css` `@theme`. |
| Mode B routes must not import framer-motion | data-mode="operational" kills mesh/blur; admin should stay light, snappy. |
| Books in heroes are NOT clickable | `asStatic={true}` + no hover zoom. Don't add Links to side cards. |
| BUILD-JOURNAL drift | Always update at end of batch. |
| `gh` auto-close via "Closes #N" | Can wrongly close issues if you reference the wrong number. Check `gh issue list` after every push. |
| Foreground colour for limbs | `var(--foreground)` so visible in both modes. Don't hardcode FACE_STROKE. |
| BookCard `asStatic` mode skips Link AND zoom | Hover effects only when truly clickable. |

---

## 11. User communication style

- **Wants momentum.** Short answers, decisive direction. Avoid
  long-winded explanations of trade-offs unless asked.
- **Files matter.** They want issues tracked, journal updated,
  commits with `Closes #N`. Don't leave things untracked.
- **Likes the mascots and brand voice.** "Cool but restrained" is
  the bar. No AI-SaaS aesthetic — see CLAUDE.md §5.
- **Reviews via screenshots.** They drop screenshots in `review/`
  and tell you to check. Always look at the actual images via the
  Read tool.
- **Tolerates iteration.** Several rounds of "the mascot still
  isn't right" were friendly, not annoyed. Keep going.
- **Doesn't lecture you back.** When they correct something, fix it
  + move on. Don't apologise excessively.
- **Hates verbose copy.** They've explicitly cut my microcopy
  ("looks hella cheap", "just nice try smarty pants"). When in
  doubt, ship less text.
- **Wants the journal accurate.** Don't claim fixes that didn't
  land. (I burned trust here — phantom Edit commits. Grep verify.)
- **Doesn't speak fluent design.** They describe outcomes ("books
  are too far back on the z-axis") rather than specifying values.
  Translate intent → concrete component changes.

---

## 12. Recent commits (most → least recent)

```
e5fb59e phase-1.6 follow-up #3: book facing fixed, no-zoom hero, real spread bump
3f5d585 phase-1.6 follow-up #2: env wrapper, all-books-eligible, wider spread, open book
ffca4a0 docs: bring BUILD-JOURNAL up to date through Phase 1.6 follow-ups
a7997a5 phase-1.6 follow-up: navbar edges, side cards, smoothing, tabs, /store
d8329b1 phase-1.6 follow-up: hero polish + live admin overview
c2a1c8a phase-1.6: storefront hero — scroll-reveal homepage + layered IBDP/IGCSE
9249340 phase-1.4: hardening — env validator, 404/error, sitemap, OG image
1c28b95 phase-2.5: admin auth + route middleware
061673c phase-2.4: customer auth flows — Google + email + magic-link verify
b2c1f19 phase-2.3: auxiliary schema — access_grants, coupons, community + RLS
4e09e59 phase-2.2: core schema — users, books, orders, carts + RLS
5bde065 phase-2.1: Supabase scaffolding + client helpers
24e345c docs: SETUP-PHASE-2.md — manual setup needed before Phase 2 code
```

---

## 13. Immediate next bug (user-requested for the new session)

**User's words (2026-05-27, end of previous session):**

> the books are really far back on the z-axis bring them closer for
> all the home page and ibdp and igcse, the home page right before
> this one looked better

**What this means:**
The last commit (`e5fb59e`) reduced side-book size from `lg` (288 px) to
`md` (192 px) AND increased horizontal spread to `260 + (d-1) * 160/150`.
The combined effect made side books look small + far back. User
wants them feeling closer + larger (the state before `e5fb59e`).

**What to do:**
1. File the bug as a GitHub issue using the bug-report template.
2. Likely fix: revert side cards to `size="lg"` (288 px), reduce
   spread back to roughly `200 + (d-1) * 100` for layered hero and
   `220 + (d-1) * 110` for scroll-reveal. Reduce `rotateY` from -22°
   to ~-15° (less perspective tilt = feels closer). Reduce scale
   shrink rate (was 0.92 - depth*0.05; try 0.94 - depth*0.04).
3. Affected files (use Read first, then Edit, then grep to verify):
   - `src/components/features/store/layered-book-hero.tsx`
   - `src/components/features/store/scroll-reveal-hero.tsx`
4. Build + smoke test all three pages (`/`, `/ibdp`, `/igcse`).
5. Commit with `Closes #<num>` and push. Update BUILD-JOURNAL.

The "right before" state corresponds to commit `3f5d585` — `git diff
3f5d585..e5fb59e -- src/components/features/store/` shows exactly
what changed if useful.

---

## 14. Quick start checklist for the new instance

1. **Read this whole file.**
2. `git log --oneline -15` to confirm you're on `e5fb59e`.
3. `gh issue list --state open` to confirm the 6 deferred items.
4. `pnpm install` (probably already done, but safe).
5. `pnpm supabase:start` (via the wrapper — picks up `.env.local`).
6. `pnpm dev` and open `http://localhost:3000`.
7. Address the bug in §13 first.
8. After fixing: file issue → fix → commit with `Closes #N` →
   `git push origin main` → confirm `gh issue close` happened
   automatically (or do it manually if not).
9. Update `BUILD-JOURNAL.md` at the end of the batch. Verify by
   `grep`-ing for a unique phrase from your additions.

Welcome to the project. Don't break the mascots.
