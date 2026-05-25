# Build Journal — Advaita

Step-by-step log of what was done on this project (no code snippets).  
Errors, fixes, and how they were detected are called out when relevant.

**Repo:** https://github.com/ShubhamSachdeva311205/Advaita  
**Local path:** `/Users/shubhamsachdeva/Documents/Mom_Biness`

### Latest health check (Cursor)

| Check | Status |
|-------|--------|
| `pnpm build` (`4232e38`) | Pass — `/`, `/design-tokens` |
| Dev server | http://localhost:3000 — run `pnpm dev` if refused |
| GitHub sync | Push `1690ac3`…`4232e38` after this journal commit |
| Claude Code | **1.2 forms shipped** — waiting on user feedback; nav/overlays/states still pending |
| Open feedback | **Collar mascot** — rework after 1.2/1.3; then roadmap review |

**See Phase 1.2 UI:** http://localhost:3000/design-tokens → scroll to **Forms** and **Badges** (below Buttons).

---

## Phase 1.1 refresh & tune (post–1.1 commits)

**Status:** Complete (pushed)  
**Date:** 2026-05-26

### Steps performed

1. **`7801bc6` — phase-1.1-refresh** — Brand palette updates in `globals.css`, punchier mesh in `backgrounds.css`, `NoiseLayer`, blob **mascots** (`mascot.tsx`), expanded `/design-tokens` playground layout.

2. **`0b57594` — phase-1.1-tune** — Refined mascots to blob style, **coupon easter egg** (`coupon-chip.tsx`), typography tweaks, emerald lock on brand tokens.

3. **`8315fcd` — phase-1.2 (partial)** — Expanded mascot cast: collar, glasses, bookworm, star (decorative). *User feedback: collar needs rework; other characters look good.*

### Phase 1.2 form primitives (committed)

| Commit | Message |
|--------|---------|
| `1690ac3` | phase-1.2: Input, Label, Textarea, FormField, Badge |
| `47ce47b` | phase-1.2: Select, RadioGroup, Checkbox (Radix-based) |
| `4232e38` | phase-1.2: form primitives in /design-tokens playground |

**Playground sections (top → bottom):** Hero → Mascots → Typography → Colors → Status → Buttons → **Forms** → **Badges** → Cards.

**Still pending for 1.2:** Skeleton, EmptyState, ErrorState, Dialog, Drawer, Popover, Toast, Navbar, Footer.

**Local only:** `combined_ss_from_mindspace.png`, `.claude/skills/`

### Errors (refresh session)

##### `/design-tokens` 500 during hot reload

| | |
|---|---|
| **Symptom** | Dev log showed intermittent `GET /design-tokens 500` while `mascot.tsx` was editing |
| **How detected** | Next dev server terminal output during Fast Refresh |
| **Fix** | Transient — full reload after save; page returned 200 |
| **Verification** | `pnpm build` on `8315fcd` succeeds; curl 200 |

---


## How to use this file

| Phase | What to log |
|-------|-------------|
| **Phase 0** (done) | Main steps only — light on errors |
| **Phase 1+** | Every step + **errors/bugs/vulnerabilities** in detail: symptom, how detected, fix, verification |

After each work session: add an entry here → `git commit` → `git push` so GitHub stays in sync.

---

## Phase 0: Project Foundation

**Goal (from roadmap):** Lock repository, environment, AI rules, and design spec before app code.

**Status:** Complete  
**Date:** 2026-05-26

### Steps performed

1. **Read `roadmap.txt`** — Confirmed Phase 0 scope: env setup, Next.js scaffold, git security, `CLAUDE.md`, `design-system-spec.md`.

2. **Checked local environment**
   - Node.js: v24.8.0 — OK
   - Git: 2.39.5 — OK
   - pnpm: not installed initially

3. **Installed pnpm via Corepack**
   - Ran `corepack enable` and `corepack prepare pnpm@latest --activate`
   - Result: pnpm v11.3.0 available

4. **Scaffolded Next.js app**
   - Target: App Router, TypeScript, Tailwind CSS, ESLint, `src/` directory, `@/*` import alias, Turbopack
   - Used `pnpm create next-app@latest` with non-interactive flags
   - Stack installed: Next.js 16.2.6, React 19, Tailwind 4

5. **Moved project to repo root**
   - App was first created in a `mom-biness/` subfolder (see errors below)
   - Used `rsync` to move all files to `/Users/shubhamsachdeva/Documents/Mom_Biness/` so `roadmap.txt` stays alongside the app

6. **Secured environment files**
   - Confirmed `.gitignore` blocks `.env.local` and other env files
   - Added explicit `.env.local` entries and `!.env.example` exception
   - Created `.env.example` with placeholder keys for Supabase, Razorpay, R2, Resend (no secrets)

7. **Created `CLAUDE.md`**
   - AI/developer rules: stack overview, Mode A vs B principle, Supabase-migrations-only rule, TypeScript/Next/component standards, business rules table, security “do not” list

8. **Created `design-system-spec.md`**
   - Two UX modes (Cinematic Premium vs Operational Clarity), typography, spacing, radius, color tokens, backgrounds, component/state requirements, admin status colors, legal shell notes

9. **Updated `roadmap.txt`**
   - Marked all Phase 0 checkboxes `[x]`

10. **Verified production build**
    - Ran `pnpm approve-builds` for `sharp` and `unrs-resolver` (native deps)
    - Ran `pnpm build` — succeeded

11. **Initialized Git and committed**
    - `git init` on `main`
    - Commit 1: `phase-0: project foundation` (22 files)
    - Commit 2: `phase-0: set turbopack root to fix workspace warning`

12. **Started dev server**
    - Ran `pnpm dev` in background for local preview

13. **Renamed project to Advaita (follow-up)**
    - Changed `package.json` name from `mom-biness` to `advaita`
    - Commit 3: `phase-0: rename package to advaita`
    - Linked remote to existing empty GitHub repo `ShubhamSachdeva311205/Advaita`
    - Pushed `main` — all Phase 0 commits now on GitHub

### Errors & fixes (Phase 0)

#### 1. pnpm not found

| | |
|---|---|
| **Symptom** | `pnpm: command not found` when checking environment |
| **How detected** | Shell exit code 127 on `pnpm -v` |
| **Fix** | Enabled Corepack (`corepack enable`) and activated latest pnpm |
| **Note** | First attempt inside sandbox failed with `EPERM` on symlink to `/opt/homebrew/bin/pnpm` |

#### 2. Corepack EPERM in sandbox

| | |
|---|---|
| **Symptom** | `Internal Error: EPERM: operation not permitted, symlink ... pnpm.js` |
| **How detected** | Corepack command failed with exit code 1 |
| **Fix** | Re-ran same command with full permissions (outside sandbox) |
| **Verification** | `pnpm -v` returned `11.3.0` |

#### 3. Next.js create failed on current folder name

| | |
|---|---|
| **Symptom** | `Could not create a project called "Mom_Biness" because of npm naming restrictions: name can no longer contain capital letters` |
| **How detected** | `pnpm create next-app` exit code 1 with explicit npm message |
| **Fix** | Created app in subdirectory `mom-biness/`, then moved contents to repo root with `rsync` |
| **Verification** | `package.json`, `src/`, `node_modules/` present at repo root |

#### 4. pnpm ignored build scripts (non-fatal)

| | |
|---|---|
| **Symptom** | `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@0.34.5, unrs-resolver@1.12.2` — install reported as aborted but files were on disk |
| **How detected** | create-next-app / `pnpm install` stderr |
| **Fix** | Later ran `pnpm approve-builds sharp unrs-resolver` then `pnpm install` |
| **Verification** | `pnpm build` completed successfully |

#### 5. Git init blocked in sandbox

| | |
|---|---|
| **Symptom** | `fatal: not a git repository` then `.git/hooks/: Operation not permitted` on `git init` |
| **How detected** | git commands in sandboxed shell |
| **Fix** | Ran `git init` with full permissions |
| **Verification** | Commits created on `main` |

#### 6. Turbopack workspace root warning

| | |
|---|---|
| **Symptom** | `Next.js inferred your workspace root... multiple lockfiles` — pointed at `/Users/shubhamsachdeva/package-lock.json` instead of project |
| **How detected** | stderr during `pnpm build` |
| **Fix** | Set `turbopack.root` to project directory in `next.config.ts` |
| **Verification** | Rebuild succeeded; dedicated commit pushed |

#### 7. Dev server port conflict (informational)

| | |
|---|---|
| **Symptom** | `Port 3000 is in use by process 37460, using available port 3001 instead` |
| **How detected** | `pnpm dev` startup log |
| **Fix** | None required — Next.js auto-selected 3001 |
| **Action** | Use http://localhost:3001 if 3000 is busy |

#### 8. GitHub CLI not available (initial session)

| | |
|---|---|
| **Symptom** | `gh: command not found` when checking auth |
| **How detected** | Shell exit 127 |
| **Fix** | Documented manual push steps for user; resolved in later session when `gh` was installed and logged in as `ShubhamSachdeva311205` |

### Manual items (not automated)

- **GitHub 2FA** — Enable in GitHub account settings (user action)
- **Branch protection on `main`** — Configure in repo Settings → Branches (user action)
- **Copy `.env.example` → `.env.local`** — When services are wired up (Phase 2+)

### Phase 0 commits on GitHub

| Commit | Message |
|--------|---------|
| `e0a08a9` | phase-0: project foundation |
| `b0e3530` | phase-0: set turbopack root to fix workspace warning |
| `3295f5f` | phase-0: rename package to advaita |

---

## Phase 1: UI/UX Foundation

**Goal:** Visual system from tokens → components → page shells.  
**Subphase 1.1:** Complete. **1.1 refresh/tune:** Complete. **1.2:** Partial (forms + badges done; nav/overlays/states pending). **1.3:** Pending.

### Subphase 1.1 — Design tokens & primitives

**Status:** Complete
**Date:** 2026-05-26

#### Steps performed

1. **Installed Phase 1.1 dependencies** (`pnpm add`):
   `class-variance-authority`, `clsx`, `tailwind-merge`, `next-themes`,
   `framer-motion`, `lucide-react`, `tw-animate-css`, `@radix-ui/react-slot`.

2. **Scaffolded the full `src/` folder contract** from `CLAUDE.md` §3:
   `src/actions/`, `src/components/{ui,features,layouts}`,
   `src/lib/{motion,supabase}`, `src/types/`, `src/styles/`.
   Folders with no real file yet hold a `.gitkeep` placeholder.

3. **Added `cn()` helper** at `src/lib/utils.ts` (clsx + tailwind-merge).

4. **Built the two-layer token system** in `src/app/globals.css`:
   - Layer 1 (`@theme`): font, tracking, radius primitives.
   - Layer 2 (semantic aliases on `:root` / `.dark` / `[data-mode="operational"]`):
     spec-mandated tokens plus shadcn-compatible names
     (`--card`, `--popover`, `--primary`, `--secondary`, `--accent`,
     `--input`) and four status pairs (success/warning/pending/destructive)
     using emerald/amber/blue/rose hues in OKLCH.
   - `@theme inline` re-exports all semantic tokens as `--color-*` keys
     so Tailwind utilities (`bg-background`, `text-muted-foreground`,
     `border-border`, etc.) resolve without a `tailwind.config.ts`
     (Tailwind v4 CSS-first).
   - Added `@custom-variant op` so components can write `op:rounded-md`
     to target operational routes.
   - Global focus ring + `prefers-reduced-motion` safety net.
   - **Fixed:** removed the stray `font-family: Arial, Helvetica` on `body`
     from the CRA scaffold — now `var(--font-sans)`.

5. **Extracted typography ramp** to `src/styles/typography.css` —
   `.text-display`, `.text-title`, `.text-headline`, `.text-eyebrow`,
   `.text-body`, `.text-body-lg`, `.text-caption`, `.text-mono`.

6. **Built the background utility system** at `src/styles/backgrounds.css` —
   `.bg-mesh-aurora`, `.bg-mesh-soft`, `.bg-noise`. Opacity scales off the
   active theme's `--mesh-opacity` (0.10 light / 0.30 dark / 0 operational),
   so the same class adapts per context. Mode B kill-switch makes gradients
   architecturally impossible on `[data-mode="operational"]`.

7. **Configured `next-themes`** via `src/components/layouts/theme-provider.tsx`
   (`attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`,
   `disableTransitionOnChange`). Wired into `src/app/layout.tsx` with
   `suppressHydrationWarning` on `<html>` and `bg-background text-foreground`
   on `<body>`.

8. **Updated root metadata** to Advaita title/description (was
   "Create Next App").

9. **Motion primitives** at `src/lib/motion/`:
   - `tokens.ts` — `spring`, `cinematicReveal`, `hoverScale`, `tapScale`,
     `fadeUp`, `staggerContainer`, `staggerItem` (values verbatim from
     `design-system-spec.md`).
   - `primitives.tsx` — `<FadeIn>`, `<Stagger>`, `<StaggerItem>`,
     `<HoverLift>` client components. Each respects `useReducedMotion()`
     and degrades to a plain `<div>`. Header comment forbids admin/checkout
     routes from importing this module.

10. **Shared layout containers** in `src/components/layouts/`:
    - `Container` — sizes `page` / `wide` / `form` / `reading`.
    - `Section` — vertical rhythm via `tight` / `default` / `loose` spacing.
    - `Stack` and `Row` — token-driven gap / align / justify. All CVA-based.

11. **`Button` primitive** at `src/components/ui/button.tsx` — full CVA
    with variants `default | secondary | outline | ghost | destructive | link`,
    sizes `sm | md | lg | icon` (≥44px from `md` up, per CLAUDE.md §10),
    `shape` compound variant for pill vs square, `asChild` via
    `@radix-ui/react-slot`.

12. **`Card` composition** at `src/components/ui/card.tsx` —
    `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
    `CardFooter`. Variants `surface | translucent | flat`. Translucent
    auto-flattens to opaque on `[data-mode="operational"]`.

13. **Token playground** at `/design-tokens` (`src/app/design-tokens/page.tsx`)
    — every semantic token, status token, type ramp entry, button variant,
    and card variant on one page for visual calibration. `metadata.robots`
    set to `noindex, nofollow`. Removed in Phase 1.3.

14. **Build + dev smoke test** — `pnpm build` succeeds, `/`, `/design-tokens`
    both return 200, all sections (Typography / Semantic colors / Status
    tokens / Buttons / Cards) render.

#### Errors & fixes (Subphase 1.1)

##### 1. `lucide-react` version looked anomalous

| | |
|---|---|
| **Symptom** | pnpm install resolved `lucide-react@1.16.0` — much higher than expected (the library has lived at `0.x` for years). |
| **How detected** | Visual scan of install output. |
| **Fix** | None required — verified via `node_modules/lucide-react/package.json` that 1.x is the current published major. No code change. |
| **Verification** | Used `<ArrowRight />` and `<Sparkles />` in the token playground successfully. |

##### 2. `_design` route did not register

| | |
|---|---|
| **Symptom** | First post-write `pnpm build` route table listed only `/` and `/_not-found` — the playground at `src/app/_design/page.tsx` was missing. |
| **How detected** | Comparing `Route (app)` output against expected files. |
| **Root cause** | Next.js App Router treats folders prefixed with `_` as *private folders* that opt out of routing entirely. The leading underscore was meant to suggest "internal" but is reserved syntax. |
| **Fix** | Renamed `src/app/_design/` → `src/app/design-tokens/`. Search-engine isolation is handled via `metadata.robots = { index: false, follow: false }` instead. |
| **Verification** | Subsequent build listed `/design-tokens` in the route table; `curl http://localhost:3000/design-tokens` returned `200` with all expected sections present. |

#### Subphase 1.1 commits

| Commit | Message |
|--------|---------|
| `63ba20c` | docs: relocate CLAUDE.md and design-system-spec.md |
| `617c558` | phase-1.1: install ui foundation deps and scaffold src tree |
| `99c0999` | phase-1.1: token system, typography, backgrounds, next-themes |
| `d347c19` | phase-1.1: cn() helper, motion primitives, shared containers |
| `32c810f` | phase-1.1: Button and Card primitives plus /design-tokens calibration page |
| `ac9abc0` | phase-1.1: complete journal entry and tick roadmap checkboxes |

**Docs relocation (commit `63ba20c`):** Root `CLAUDE.md` → `.claude/CLAUDE.md`; root `design-system-spec.md` → `design/design-system-spec.md`. Phase 1.1+ references use these paths.

**Intentionally not committed:** `.claude/skills/` (shadcn-architect, motion-designer, tailwind-mastery, react-perfectionist, impeccable) — local Claude Code helpers only; add a follow-up commit if you want them on GitHub.

#### How to preview the UI (Subphase 1.1)

| What | Ready? | URL |
|------|--------|-----|
| **Design token playground** | Yes | http://localhost:3000/design-tokens |
| **Homepage (`/`)** | No — still default Next.js starter | http://localhost:3000/ |
| **Store / admin shells** | No — Subphase 1.3 | — |

```bash
cd /Users/shubhamsachdeva/Documents/Mom_Biness
pnpm dev
```

Open **/design-tokens** for typography, semantic colors, status tokens, Button variants, and Card variants. Dark mode is default (`next-themes`, no toggle yet). If port 3000 is busy, use the port shown in the terminal (e.g. 3001).

**Verified (Cursor, 2026-05-26):** `pnpm build` lists routes `/`, `/design-tokens`; build succeeds.

### Subphase 1.2 — Shared UI components

**Status:** Complete  
**Date:** 2026-05-26

#### Steps performed

1. **Form primitives** (commits `1690ac3`, `47ce47b`, `4232e38`):
   - `Label` wrapping `@radix-ui/react-label` (CVA size + required asterisk).
   - `Input` with CVA size (`sm`/`md`/`lg`, md ≥ 44px per CLAUDE.md §10) and state (default/error).
   - `Textarea` mirroring Input's state model with `min-height: 96px` and `resize-y`.
   - `FormField` composer that wires `Label` + control + helper/error using `useId` + `cloneElement` to inject `id`, `aria-describedby`, `aria-invalid`, and the error `state` into the single child control automatically.
   - `Badge` with status variants (`success` / `warning` / `pending` / `destructive`) bound to the same semantic tokens used on the order pills, plus generic `default`/`secondary`/`outline`/`brand` variants. Uses `text-mono-tag` so badges share rhythm with coupon chips.
   - `Select` wrapping `@radix-ui/react-select` (trigger matches Input visuals; portaled content; lucide ChevronDown/Up/Check).
   - `RadioGroup` wrapping `@radix-ui/react-radio-group` (brand-color checked state with a small brand-foreground dot).
   - `Checkbox` wrapping `@radix-ui/react-checkbox` (Check or Minus icon — Minus handles Radix's indeterminate state).
   - `/design-tokens` Forms section: text-fields card (Input + Textarea + an Input in error state with helper/error copy) and choice-fields card (Select for curriculum + RadioGroup for format + Checkbox for ToS).
   - `/design-tokens` Badges section: admin order-state row (New / Packed / Shipped / Pending payment), generic variants, and an in-context order ID + coupon example.

2. **Mascot collar fix** (commit `ee511db`): the previous thick V-stroke read as a chin marking, not a uniform collar. Replaced with a small pentagon-with-V-notch shape filled near-white with a 35% face-color outline — reads instantly as a button-down shirt visible at the neckline.

3. **State primitives** (commit `ee511db`):
   - `Skeleton` with shape variants `line`/`block`/`circle`, animated pulse.
   - `EmptyState` accepting either a `mascot` prop (storefront) or a Lucide `icon` (operational) — when no mascot/icon is passed, falls back to `Inbox`. Always renders `title` + `description` and an optional `action`. Encodes CLAUDE.md §11.
   - `ErrorState` with destructive-toned `AlertTriangle` ring, friendly copy that locates fault on our side, optional `onRetry` handler that auto-renders a `Try again` button.

4. **Overlay primitives + ThemeToggle** (commit `a79e3d7`):
   - `Dialog` (`@radix-ui/react-dialog`): centered, max-w-lg, backdrop-blurred on storefront, opaque on operational via `op:` variant. Header/Title/Description/Footer/Close exposed.
   - `Drawer` (`vaul`): mobile-first bottom sheet with swipe-to-dismiss. Same API shape as Dialog so consumers can swap based on viewport. Drag-handle pill on top.
   - `Popover` (`@radix-ui/react-popover`): smaller inline panel for tooltips with body content. Same animation vocabulary as Dialog.
   - `Toaster` (`sonner`): mounted once in the root layout; theme follows next-themes via `resolvedTheme`. Re-exports `toast`.
   - `ThemeToggle`: Sun/Moon button hitting `setTheme`. SSR guard via `mounted` flag.
   - Root layout now mounts `<Toaster />` beside `children` inside `ThemeProvider`.
   - `/design-tokens` overlays section: Dialog (mark shipped confirm), Drawer (mobile order-actions sheet), Popover (coupon details), four toast triggers in a small `'use client'` island (`toast-demo.tsx`), and an inline ThemeToggle.

5. **Mascot accessories + KineticHeading + Navbar + Footer** (commit `ba38159`):
   - Three new accessory SVG fragments wired into the `ACCESSORIES` map: `cap` (graduation cap with brand-color tassel), `headphones` (band over the head with two cups + brand speaker dot), `backpack-strap` (diagonal cross-body strap).
   - `bookworm` now wears headphones (tall capsule + emerald→violet gradient + music = study companion). Eye/smile positions nudged so the headphone band sits above the eyes correctly.
   - `KineticHeading`: splits a heading string into words and reveals them with a staggered slide-up + fade (matvoyce.tv-flavored entrance). One word optionally highlighted in brand color via `emphasize` index. Respects `useReducedMotion`.
   - `Navbar` (Mode A): sticky, backdrop-blurred, with star mascot logo lockup + Advaita wordmark, desktop nav links, cart button, ThemeToggle, and a mobile menu that uses Drawer with the same links.
   - `Footer` (Mode A): four-column grid (brand blurb + Catalog / Community / Help) with caption-toned link list and a version stamp in mono.
   - Lowered `.noise-layer` z-index from 9999 → 5 so grain modulates page content but never floats over Dialog/Drawer/Popover (z-50).

#### Errors & fixes (Subphase 1.2)

##### 1. `Stack` `gap` value not in scale

| | |
|---|---|
| **Symptom** | `Type '5' is not assignable to type '0 \| 4 \| 1 \| 12 \| 2 \| 3 \| 6 \| 8 \| null \| undefined'` |
| **How detected** | First `pnpm build` after writing the playground palette compare. |
| **Fix** | Switched the offending site to `gap={4}` then later added `10` to the scale (40px) for common section rhythm needs. |

##### 2. `JSX.Element` not in global namespace (React 19)

| | |
|---|---|
| **Symptom** | `Cannot find namespace 'JSX'` on `Record<MascotName, JSX.Element>`. |
| **How detected** | TS build error on the original mascot file. |
| **Fix** | Imported `ReactElement` from `react` and typed the map with it instead. |
| **Root cause** | React 19 + new JSX transform no longer exposes the global `JSX` namespace; you need `React.JSX.Element` or `ReactElement`. |

##### 3. `MASCOT_NAMES.map is not a function`

| | |
|---|---|
| **Symptom** | Prerender failed on `/design-tokens` with `aR.MASCOT_NAMES.map is not a function`. |
| **How detected** | First build after refactoring the mascot module to `'use client'`. |
| **Fix** | Inlined the array in the playground page; removed the export. |
| **Root cause** | Non-component exports from a `'use client'` module can be reference-replaced at the RSC boundary when consumed from a server component. Constants travel poorly across the boundary; React components and primitives are fine. |

##### 4. NoiseLayer z-index above modals

| | |
|---|---|
| **Symptom** | Dialog/Drawer/Popover overlays appeared to have grain layered on top. |
| **How detected** | Visual review while wiring overlay primitives. |
| **Fix** | Lowered `.noise-layer` `z-index` from 9999 → 5. Sits above page flow content, below interactive overlays at z-50. |

##### 5. `_design` route did not register (carried over from 1.1)

Already documented in Subphase 1.1 — renamed to `/design-tokens`.

#### Subphase 1.2 commits

| Commit | Message |
|--------|---------|
| `1690ac3` | phase-1.2: Input, Label, Textarea, FormField, Badge |
| `47ce47b` | phase-1.2: Select, RadioGroup, Checkbox (Radix-based) |
| `4232e38` | phase-1.2: form primitives in /design-tokens playground |
| `8315fcd` | phase-1.2: expand mascot cast — collar, glasses, bookworm, star |
| `ee511db` | phase-1.2: fix student collar; add Skeleton, EmptyState, ErrorState |
| `a79e3d7` | phase-1.2: Dialog, Drawer, Popover, Toast, ThemeToggle |
| `e2c1934` | phase-1.2: state + overlay sections on /design-tokens |
| `ba38159` | phase-1.2: KineticHeading, mascot accessories, Navbar, Footer |

---

### Subphase 1.3 — Page shells & layouts

**Status:** Complete  
**Date:** 2026-05-26

#### Steps performed

1. **Route group structure.** Created `(storefront)` for Mode A pages (Navbar + NoiseLayer + Footer) and `(operational)` for Mode B (data-mode="operational" + minimal top bar, no nav). `/design-tokens` stays at the top level as an internal calibration surface. Deleted the CRA boilerplate at `src/app/page.tsx` — the homepage now lives at `src/app/(storefront)/page.tsx`.

2. **Storefront shells:**
   - `/` — cinematic landing with `KineticHeading` ("Study, slowly." with the second word in brand color), four companion mascots row (student/teacher/bookworm/star), three pillar cards linking to /store, /ibdp, /community.
   - `/store`, `/ibdp`, `/igcse` — placeholder shells via the new `ShellPage` helper (eyebrow + hero + EmptyState with a thematic mascot). Each names Phase 2 as the launch milestone so the route never feels broken (CLAUDE.md §12).
   - `/community` — twin-card hero (Creative Corner + Feedback) with Mascot accents and "form coming soon" disabled buttons.

3. **Legal shells** under `(storefront)/legal/`:
   - Reading-width local layout (`Container size="reading"`, `max-w-3xl`).
   - Index page linking to three policies.
   - `/legal/terms` — short binding shipping/coupon rules + draft notice.
   - `/legal/returns` — full "all sales are final" wording with damaged-in-transit exception.
   - `/legal/privacy` — what we collect / don't collect summary.

4. **Operational shells:**
   - `(operational)/layout.tsx` sets `data-mode="operational"` on the wrapping div (existing CSS keys off this attribute), adds a minimal top bar with brand label + storefront-link, drops the storefront Navbar entirely.
   - `/admin` — command center grid (Orders / Inventory / Coupons / Customers / Submissions) with status Badges in the header (`0 new`, `0 packed`, `0 shipped`) and a no-orders EmptyState below.
   - `/dashboard` — customer library with no-purchases EmptyState plus a card explaining the Amazon-buyer manual access workflow.
   - `/checkout` — empty-cart state pointing back to the store.

5. **Supporting:**
   - `src/components/layouts/shell-page.tsx` — `ShellPage` helper composing hero + EmptyState so the placeholder pages share one source of truth.
   - Extended `Stack` `gap` scale with `10` (40px) for common section rhythm.

#### Errors & fixes (Subphase 1.3)

##### 1. `Stack` `gap={10}` not in scale (recurrence of 1.2 issue)

| | |
|---|---|
| **Symptom** | `Type '10' is not assignable to type '0 \| 4 \| 1 \| 12 \| 2 \| 3 \| 6 \| 8 \| null \| undefined'`. |
| **How detected** | Build after writing `(storefront)/community/page.tsx`. |
| **Fix** | Added `10: 'gap-10'` to the Stack CVA scale rather than chase replacements. |

#### Subphase 1.3 commits

| Commit | Message |
|--------|---------|
| `be326f3` | phase-1.3: route shells — storefront, legal, operational |

#### Routes prerendered after 1.3

```
/                       (storefront home)
/_not-found
/admin                  (operational)
/checkout               (operational)
/community              (storefront)
/dashboard              (operational)
/design-tokens          (internal calibration)
/ibdp                   (storefront)
/igcse                  (storefront)
/legal                  (storefront)
/legal/privacy
/legal/returns
/legal/terms
/store                  (storefront)
```

All 14 routes return 200 in dev and prerender as static content in production builds.

---

## Roadmap audit (2026-05-26)

After 1.3, audited `roadmap.txt` end-to-end against the actual product
plan. Findings, recommendations, and the diff I applied directly are
in `design/roadmap-audit.md`. Headline changes:

- Added **Subphase 1.4 (Hardening)** — env validator, error/404 pages, sitemap, OG images.
- Phase 2 explicitly separates **customer auth** from **admin auth** (allowlist-based magic-link only for admin).
- Added **carts table** to Phase 2.
- Renumbered Phase 3 to add **3.2 cart + order confirmation**, **3.4 refund/chargeback webhooks**, **3.5 GST/tax**.
- Added **Subphase 5.3 product CRUD + image upload** so admin actually has a way to add books and cover images.
- Added **Subphase 5.4 mobile admin QA** as an explicit launch gate.
- Split old Phase 7 into **Phase 7 (transactional emails)**, **Phase 8 (polish & launch readiness — SEO, observability, accessibility, performance, backup drill)**, **Phase 9 (deployment + Razorpay test→live cutover)**.
- Renumbered "future scaling" from 8 → 10.

Open decisions flagged in the audit (require user input before
implementation):

- Cart state location (Supabase table vs localStorage).
- Whether wishlist/reviews ship in v1 or stay in Phase 10.
- Newsletter provider (Resend audiences vs ConvertKit/Buttondown).
- Mirror digital-grant emails to a manual override spreadsheet for offline resilience?

---

## Phase 2–10

*Placeholder — journal sections will be appended when each phase begins.*
