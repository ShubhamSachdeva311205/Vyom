# Advaita — Session Handoff

For the **next Claude Code instance.** Read me end-to-end before
touching code. I cover only what *isn't* already in
`roadmap.txt`, `BUILD-JOURNAL.md`, `FULL_FEATURE_REFERENCE.md`,
`.claude/CLAUDE.md`, or `memory/`. Skim those for what they cover;
don't expect this file to repeat them.

---

## Where to find things

| Question | Look in |
|---|---|
| What's shipped, what's next, phase status | `roadmap.txt` |
| Why a thing was built that way, errors hit + fixes, commit log narrative | `BUILD-JOURNAL.md` |
| What the product is supposed to do (every page, every admin tool) | `FULL_FEATURE_REFERENCE.md` |
| Architecture rules + coding standards | `.claude/CLAUDE.md` (read in full) |
| Behavioural rules captured from the user | `memory/*.md` (loaded via index) |
| Open work tracker | `gh issue list --state open` |
| Security probe battery | `/security-audit` skill |
| Razorpay onboarding for the user | `SETUP-PHASE-3.md` |
| Phase 2 setup notes for the user | `SETUP-PHASE-2.md` |

If a question is answered in one of those, link there — don't
duplicate.

---

## Project at a glance

**Advaita** — premium e-commerce for IBDP + IGCSE Hindi study books.
Built by Shubham for his mom Seema Sachdeva (author / sole seller).
Catalogue: 7 physical titles; audio + answer keys are FREE support
material bundled with the physical book.

### Stack

Next.js 16 App Router (Turbopack) · TypeScript strict · Tailwind v4
(CSS-first, **no `tailwind.config.ts`**) · Framer Motion (storefront
only) · Supabase (local Docker + CLI; 14 tables, RLS on all) ·
shadcn-style hand-authored primitives · Razorpay (test mode in dev) ·
Shiprocket (queued for Phase 3.3) · pnpm · gh CLI.

### Folder shape (only what's non-obvious)

- `src/app/(storefront)/` — Mode A pages (Navbar + Footer + NoiseLayer)
- `src/app/(operational)/` — Mode B (`data-mode="operational"`, no
  Framer, no mesh)
- `src/app/(auth)/` — clean centred card layout
- `src/app/api/` — webhook + streaming routes ONLY
- `src/actions/` — Server Actions, one file per domain
- `src/lib/cart/`, `src/lib/razorpay/` — feature libs (server-only)
- `scripts/supabase-with-env.sh` — wrapper that sources `.env.local`
  before exec'ing supabase (CLI doesn't auto-read it)
- `book-covers/book-covers-raw/` — user-dropped originals + manual
  filename→slug map; `scripts/process-book-covers.py` crops them
- `design/`, `review/` — design notes + user screenshot uploads

---

## Quick-start checklist

1. `git log --oneline -15` — orient on recent work.
2. `gh issue list --state open` — see what's tracked.
3. Skim the LAST few sections of `BUILD-JOURNAL.md` — they cover
   what just happened (especially the "Next up" list at the
   bottom).
4. `pnpm install` (idempotent).
5. `pnpm supabase:start` (uses the env wrapper).
6. `pnpm dev` → http://localhost:3000.
7. If the user gave a specific task, do that. Otherwise pick the
   top "Next up" item from the journal and confirm with the user
   before starting.

---

## Open user-action items

Things the USER needs to do (not Claude). Surface at session start
if they're still open.

| # | Item | What user needs to do |
|---|---|---|
| #7 | Google OAuth still failing | (a) Confirm `http://localhost:54321/auth/v1/callback` is whitelisted in Google Cloud Console → Credentials. (b) Try Google sign-in + paste the bounce URL + auth container logs. Deferred to Phase 7. |
| #81 | Shiprocket creds | Paste `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` (dashboard login) into `.env.local`. Blocks Phase 3.3 implementation. |

---

## Open-issues snapshot

Run `gh issue list --state open` for the live list. Categories as of
the most recent session:

- **Security P0s** — #74 admin gate drift, #75 first-admin takeover.
  Tracker: #76 umbrella (full 21-finding checklist).
- **FFR backlog** (#53–#73) — every FFR sub-section not yet shipped,
  filed by the end-of-day backlog sweep. Includes PDP, customer
  dashboard, all admin sections, transactional emails, the new
  admin asks (sales reports #70, analytics #71, Excel #72), and
  the local Ollama AI assistant (#73, Phase 10).
- **Pending verify** — issues marked OPEN awaiting the user's
  visual sign-off (per `memory/feedback_verify_before_closing.md`).

---

## Known gotchas — defence against landmines we've already hit

| Pitfall | Defence |
|---|---|
| `Edit()` silently fails if the file wasn't `Read()` first | Read before Edit. After any non-trivial Edit, grep for the new content to confirm. |
| Supabase CLI doesn't read `.env.local` | Use `./scripts/supabase-with-env.sh` (or `pnpm supabase:*` scripts). |
| React 19 + Turbopack jankifies `React.Children.only` | Use `isValidElement + cloneElement` instead. |
| `useTransform` doesn't accept union types | Pass MotionValues; use `useMotionValue(1)` for reduced-motion constants. |
| Mascot SVG hardware = `FACE_STROKE`; accents = `currentColor` | Don't swap these. Hardware is the silhouette; accents shift red on sad mood. |
| Tailwind v4 is CSS-first | All tokens live in `globals.css` `@theme`. Never create `tailwind.config.ts`. |
| Mode B routes must not import Framer | `data-mode="operational"` zeroes mesh/blur; admin should stay snappy. |
| Books in heroes are NOT clickable | `asStatic={true}`. No Links, no hover zoom. |
| Service-role used in cart writes | Code-level ownership check is the ONLY defence. Don't add a code path that forgets it. Switch to anon-client + RLS via `set_config` long-term (audit #9). |
| Sub-pixel SVG motion looks jittery | Bump amplitude above ~2px or use `repeatType: "reverse"` on a single target. SVG `<g>` doesn't get GPU layer like a div. |
| `gh` `Closes #N` keyword auto-closes | Use `Refs #N` until user signs off visually (see `memory/feedback_verify_before_closing.md`). |

---

## User communication style

- **Wants momentum.** Short decisive answers. No long trade-off essays.
- **Files matter.** Issues, journal updates, roadmap ticks. Don't leave
  things untracked. Per `memory/feedback_roadmap_and_journal_per_commit.md`,
  the journal + roadmap update lands in the same commit as the code.
- **Reviews via screenshots in `review/`.** Always Read the actual
  images.
- **Tolerates iteration.** Several rounds of "still not right" are
  friendly. Fix + move; don't apologise excessively.
- **Hates verbose copy.** Cuts microcopy ruthlessly ("looks hella
  cheap"). When in doubt, ship less text.
- **Doesn't speak fluent design.** They describe outcomes ("books
  are too far back on the z-axis"), not values. Translate intent
  → concrete component changes.
- **Wants the journal accurate.** Don't claim fixes that didn't
  land. Grep-verify after Edit.
- **Don't credit Claude in commits.** No `Co-Authored-By`, no
  "Generated with Claude Code" footer. See
  `memory/feedback_no_co_authored_by.md`.
- **Wait for visual sign-off before closing issues.** See
  `memory/feedback_verify_before_closing.md`.

---

## Don't break these

- The mascot colour separation (`FACE_STROKE` vs `currentColor`).
- The Tailwind-v4 CSS-first config — never add `tailwind.config.ts`.
- The `supabase-with-env.sh` wrapper.
- `ai@gravity.fast` belongs nowhere except (historically) git commit
  attribution. Anywhere else = bug. (Current git identity is
  `shubhamsachdeva245@gmail.com`; production owner email is
  `shubhamhelpseries@gmail.com` — see CLAUDE.md §14.)
- The `(operational)` route group's no-Framer / no-mesh rule.
- The print CSS on `/order/[id]/success` (drops nav/footer/buttons
  so save-as-PDF looks like a clean receipt).

Welcome to the project. Don't break the mascots.
