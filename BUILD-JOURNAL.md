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

---

## Phase 1.4 · Hardening

**Status:** Complete  **Date:** 2026-05-26  **Commit:** `9249340` + `b4c7710` + `28130ea`

env validator (`src/lib/env.ts`) — zod schema covering current + Phase
2/3/4/7 keys. Production refinement on `RAZORPAY_KEY_ID` requires the
`rzp_live_` prefix. Coerces empty `KEY=` to `undefined` before parsing
so `.optional()` actually fires.

Routes: `/error` (client component wrapping `ErrorState` with retry),
`/not-found` (404 with sad bookworm + red headphones + back-to-home),
`sitemap.ts` + `robots.ts` (storefront only, admin excluded),
`opengraph-image.tsx` (edge runtime, Satori-rendered 1200×630 PNG).

Roadmap 1.4 checkboxes all ticked.

#### Errors & follow-up fixes captured as GitHub Issues

- **CouponChip never copied** → empty catch was swallowing failures.
  Fixed with stopPropagation + execCommand fallback + sonner toast.
- **Navbar logo overlapped wordmark** → Mascot's `sm` size was 96 px;
  override only sized the wrapper, not the SVG. Added `xs` size + used
  it in navbar.
- **Sad-mood face flipping to happy on hover** → variants overrode the
  rest face. Neutralised hover variants when `mood='sad'`; skipped
  awake-face render entirely.
- **Headphone perspective fix** → cups moved inward, second thin back
  arc behind head between cups, inner-of-cup darker circle offset
  inward.

---

## Phase 2 · Database & Authentication

**Status:** Complete  **Date:** 2026-05-26  **Commits:** `5bde065` → `92d3536` (six subphase commits) + `638e20a` checkbox tick + `27a8e83` workflow + `cc42e72` fixes batch + `5439aba` FFR alignment

### Subphase 2.1 — Supabase scaffolding (`5bde065`)

Installed `@supabase/supabase-js` + `@supabase/ssr` + `supabase` CLI as
devDep + `disposable-email-domains`. `supabase/config.toml` customised:
project_id=advaita, site_url=localhost:3000, redirect URLs added,
`enable_confirmations=true` (magic-link verification required),
`[auth.external.google]` block with env() substitution.

`src/lib/supabase/{client,server,middleware,types}.ts` — browser +
server + service-role + middleware-refresh clients. Type codegen
script: `pnpm supabase:types`.

### Subphase 2.2 — Core schema (`4e09e59`)

Six tables (`users`/`books`/`orders`/`order_items`/`carts`/`cart_items`)
with RLS. Money in paise. `auth.users` → `public.users` via
`on_auth_user_created` trigger. `is_admin()` helper for RLS policies.

### Subphase 2.3 — Auxiliary schema (`b2c1f19`)

Five more tables (`access_grants`/`coupons`/`coupon_redemptions`/
`content_submissions`/`feedback`) with RLS. `coupon_redemptions` UNIQUE
on (coupon_id, user_id) enforces one-per-email + single-use vendor
codes. `content_submissions` + `feedback` accept guest submissions.

### Subphase 2.4 — Customer auth flows (`061673c`)

Server Actions in `src/actions/auth.ts` (signUp, signIn,
signInWithGoogle, signOut). Disposable-email blocklist (3-layer:
canonical 10k + curated extras + regex patterns). OAuth callback route
exchanging code for session. `(auth)` route group with clean layout.
Sign-up + sign-in pages with Google button + email form.

### Subphase 2.5 — Admin auth + middleware (`1c28b95`)

Magic-link-only admin sign-in. `ADMIN_EMAILS` env allowlist.
`src/middleware.ts` (note: must live in `src/`, not project root, with
the `src/` app dir layout — caught when first placement no-op'd) runs
on every request, refreshes JWT, redirects unauthenticated requests
hitting `/admin/*`, `/dashboard/*`, `/checkout`.

### Subphase 2.6 — Navbar signed-in state (`92d3536`)

Navbar converted to async Server Component. Fetches user once,
renders UserMenu (Popover-based avatar dropdown) when signed in or
"Sign in" button when not. MobileNavMenu picks up the same `signedIn`
flag for the drawer footer.

### Subphase 2.7 — Alignment migration to FULL_FEATURE_REFERENCE.md (`5439aba`)

Dropped `book_format` enum + columns (no more digital-only/bundle
SKUs). Added `has_audio`, `has_answer_key`, `discount_eligible`,
`compare_at_price_paise`. Renamed `published` → `is_active`. Dropped
coupon-side scoping. New tables: `settings`, `admin_audit_logs`,
`admin_emails`. `is_admin()` rewritten to read `admin_emails` —
resolves the env-vs-DB drift bug. Seeded 7 real books from FFR §G.

#### Phase 2 follow-up commits

- `27a8e83` — GitHub Issues workflow + initial backlog templates (#1, #2, #3).
- `cc42e72` — design-tokens crash fix + westecom blocklist + OTP entry.
- `32d921d` — shorter smarty-pants copy + dark-mode warning badge.
- `638e20a` — Phase 2 roadmap checkboxes.
- `c096b62` — dedupe Google OAuth env vars.
- `6234be2` — email swap (ai@gravity.fast → shubhamhelpseries@gmail.com), FFR diff doc, admin-emails feature filed.

#### Errors & fixes (Phase 2)

| Symptom | Root cause | Fix |
|---|---|---|
| Build failed on first import of `@supabase/ssr` | `KEY=` blanks in `.env.local` failed `.url()` before `.optional()` could catch | Preprocess `process.env` to coerce `""` → `undefined` before zod parse |
| `pnpm dev` not redirecting `/dashboard` | `middleware.ts` placed at project root, ignored by Next 16 + `src/` layout | Moved to `src/middleware.ts` |
| `/design-tokens` crashed at runtime (post-Phase-2-mascot-rewrite) | `React.Children.only()` threw on single-child JSX under React 19 + Turbopack dev | Replaced with `isValidElement(children)` + `cloneElement` |
| Issue #10 auto-closed by "Closes #10" in commit body | Commit referenced the wrong issue number | Reopened; will close when UI lands in Phase 5.5 |

---

## Phase 1.5 · Mascot expansion + cover infra

**Status:** Complete  **Date:** 2026-05-26  **Commits:** `efae5bd` + this session's commits

Cast expanded 4 → 6: renamed `star` → `wisp` (the wide pebble), added
real-star and rounded-triangle shapes. Each character gets a distinct
oklch palette: emerald, amber, violet-blue, coral, gold, teal.

Headphone cups reperspectived. Student got a bigger collar + tie + new
`withLimbs` prop (stick arms + legs + 3-finger hands). `withLimbs`
extended to teacher (long enough to hang/sit), navy tie replaces the
brand-deep emerald (visibility against student blob).

Bookworm dropped headphones, gained round glasses. Floating-book
companion still pending (Issue #19 partial — covered by Issue #15
homepage scene work).

Cover pipeline: `scripts/process-book-covers.py` does OCR-based
classification via Tesseract + Pillow; supports a manual
`covers-map.txt` override for when OCR can't disambiguate Devanagari
covers. All 7 real book covers cropped + sized → `public/book-covers/`.

#### Notable GitHub Issues opened this phase

| # | Title | State |
|---|---|---|
| #1 | Homepage teaser copy | open (closes with #16) |
| #2 | Ambient brand decoration | open · Phase 8 |
| #3 | Mailpit confusion (docs) | open |
| #4 | /design-tokens crash | closed (`cc42e72`) |
| #5 | Disposable email scale | open · P3 · Phase 8 |
| #6 | OTP code entry | closed (`cc42e72`) |
| #7 | Google OAuth redirect URI | open (user action — Cloud Console) |
| #8 | Dark-mode warning badge | closed (`32d921d`) |
| #9 | Admin role consistency | closed (`5439aba` — admin_emails table) |
| #10 | Admin-managed admin allowlist | open (DB done; UI = Phase 5.5) |
| #11 | Theme switcher | open · P3 · Phase 8 |
| #12 | Mascot expansion (2 new + diversify) | open → closed when Phase 1.5 commit verified |
| #13 | Bookworm headphone perspective | superseded by Issue #19 (full bookworm redesign) |
| #14 | Student collar + tie + limbs | open · partial (collar/tie/limbs done; #19 still has floating book) |
| #15 | Storefront book display | open · P1 · awaiting covers (now landed) |
| #16 | Mascot scenes | open · P2 |
| #17 | OCR cover script | closed when covers verified |
| #18 | Teacher limbs + longer limbs | open · in progress |
| #19 | Bookworm redesign (no headphones / glasses / floating book) | open · partial |
| #20 | Student tie colour | open · in progress |
| #21 | OCR + filename fallback | closed (`cc42e72` → manual map works) |
| #22 | Homepage scroll-reveal hero | closed (`c2a1c8a`) |
| #23 | Mascot names in customer UI | closed (`c2a1c8a` — internal-only) |

---

## Phase 1.6 · Storefront hero

**Status:** In progress (UI polished; cart wiring is Phase 3)
**Date range:** 2026-05-26 → 2026-05-27

### Commits

| Commit | What |
|--------|---|
| `c2a1c8a` | scroll-reveal homepage + layered IBDP/IGCSE + BookCard + scenes |
| `d8329b1` | hero polish + live admin overview from getAdminStats() |
| `a7997a5` | navbar edges, side cards anchor fix, useSpring smoothing, curriculum tabs, /store listing |
| `3f5d585` | env wrapper for supabase CLI, all-books-eligible seed, wider hero spread, open-book vignette |
| `e5fb59e` | book-facing fix, no-zoom hero cards, side cards md + bigger spread |
| `0007920` | follow-up #4 — bring books closer on z-axis (Issue #46): side cards back to lg, offsetX 200+(d-1)*100 (layered) / 220+(d-1)*110 (scroll), rotateY -15, scale 0.94−depth*0.04 |
| _next_     | follow-up #5 — strip discount badges + bookworm polish (Issues #47 #48). BookCard / StoreListing / CurriculumTabs drop the "10% elig." / "10% off" / "No coupons" success-badges (looked cheap). Mascot gains `awake` + `lookOffsetX` props so the awake face can pin on without hover and the pupils can be nudged toward something. BookwormReading: book offset to right (`left: 78%`), bumped to 84×58 (was 64×44), rotated 180° via `<g transform="rotate(180 35 26)">`, mascot rendered `awake lookOffsetX={8}` so eyes track the book. |
| _next_     | follow-up #6 — bookworm rebuild + lint sweep + audit polish (Issues #48 retry / #49 / #50 filed). New OpenBookSVG: viewBox 90×60, two cream pages in a soft V, dark spine, brand cover-stripes, faint text lines per page — reads as a real open book. Book raised (`bottom: 34%`) + tucked closer to body (`left: 68%`). Mascot extended with `pupilAnimate` + `pupilTransition` (typed via framer's `TargetAndTransition` / `Transition`) so the awake pupils get a small wobble synced to the book's float; eyes visibly track the book. Lint fixes: theme-toggle.tsx uses `useSyncExternalStore` (replaces `useState + useEffect`-set-state pattern that violated react-hooks/set-state-in-effect under React 19). Unused `CardHeader` imports pruned from legal/page.tsx + curriculum-tabs.tsx. CurriculumTabs empty states upgraded from raw `<p>` to proper `<EmptyState>` (CLAUDE.md §11 compliance). |
| _next_     | follow-up #7 — bookworm round 3 + OAuth secret in. User flagged that the rebuilt book was facing the viewer (we saw the pages); rebuilt OpenBookSVG to show the BACK of the open book — two brand-coloured back-cover panels in a soft V joined at a darker spine, cream page-edge slivers peeking at the bottom (the open side), faint white title bars on each cover. Now reads as a book held by the bookworm with pages facing it. Book lowered slightly (`bottom: 26%`). Mascot gained `lookOffsetY` prop; bookworm rendered with `lookOffsetX={7} lookOffsetY={6}` so pupils look right + down at the book. OAuth: user populated `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in `.env.local`; supabase restarted via wrapper, the `WARN: environment variable is unset` line is now gone. Google Cloud Console redirect-URI step still on user to verify (Issue #7 stays open until sign-in succeeds end-to-end). |
| _next_     | follow-up #8 — hero re-click bug fix (Issue #51) + bookworm round 4 + OAuth deferred. Hero: side + centre books in LayeredBookHero now position via `style.{x,y,rotateY,scale}` instead of framer's `animate` target, with only `opacity` tweened on mount. Re-clicking the same curriculum nav link no longer strands books at opacity 0 — they're always at their final spread, opacity just stays at 1 on re-render. We lose the spring fan-out animation in exchange for correctness; the existing entrance feels softer (0.55s ease-out fade with depth-staggered delay). Bookworm round 4: OpenBookSVG wrapped in `<g transform="rotate(180 45 30)">` per user (V opens upward, page edges along top). Book nudged further right + down (`bottom: 18%`, `left: 76%`). Eyes pulled left (`lookOffsetX={3}`, was 7); `lookOffsetY` stays at 6. OAuth: relabeled Issue #7 from phase/2 → phase/7 + posted status comment. roadmap.txt: split Phase 2 customer-auth line into email-works ([x]) + Google-deferred ([ ]); added matching Phase 7 line so the deferral is tracked in the strategic plan. Build + lint stay clean. |

### Components shipped
- `BookCard` — cover-first card primitive, sizes sm/md/lg/xl, `asStatic` + `showMeta` knobs for hero vs grid usage.
- `LayeredBookHero` — static 3D-layered hero for /ibdp + /igcse. Each book wrapped in a full-bounds flex-centred overlay so framer's x/y translates from CENTRE, not top-left.
- `ScrollRevealHero` — homepage. `useScroll` + `useSpring(scrollYProgress, {stiffness:120, damping:30, mass:0.4})` smooths the raw scroll signal before downstream `useTransform`s derive opacity + spread. Stages: 0-8% centre solo, 8-14% opacity in at centre, 14-55% fan out. Mascots intentionally absent here.
- `mascot-scenes.tsx` — `StudentHangingFromBook` + `TeacherSittingOnBook`. Positioned via `bottom: calc(100% - 30px)` / `top: calc(100% - 30px)` so they overlap the book edge.
- `BookwormReading` — Mascot + small inline SVG book that bobs (y±8) + rotates (±3°) on a 5s loop. Respects prefers-reduced-motion.
- `CurriculumTabs` — three tabs (Order Books / Answer Keys / Listening Audio) on /ibdp + /igcse. Locked-state cards for content gated on physical-book ownership (Phase 4 streams the real PDFs/audio).
- `StoreListing` — /store unified grid with curriculum filter chips (All / IBDP / IGCSE).

### Server helpers
- `src/lib/format.ts` — pure formatters split out so client components can `formatINR(paise)` without importing the server-only books query module.
- `src/lib/queries/books.ts` — `getBooks({curriculum?})` + `getBookBySlug(slug)`.
- `src/lib/queries/admin-stats.ts` — counter helpers (HEAD selects with `count: exact`): bookCount, lowStockCount, ordersNew/Packed/Shipped, pendingSubmissions, unreadFeedback.

### Pages updated
- `/` — ScrollRevealHero + BookwormReading vignette + three pillar cards.
- `/ibdp` — LayeredBookHero (centre = HL Reading, 2L + 2R) + CurriculumTabs.
- `/igcse` — LayeredBookHero (Paper 1 centre, Paper 2 right) + CurriculumTabs.
- `/store` — StoreListing with curriculum filter.
- `/admin` — live counts via getAdminStats(); empty state surfaces only when all order counts are zero.

### Navbar
- Dropped `Container size="wide"` (max-w-7xl) so navbar items hug the viewport edges with just `px-4 sm:px-6` padding.

### Errors + lessons captured

| Symptom | Root cause | Fix |
|---|---|---|
| Side books invisible on /ibdp | Absolute children default to top-left of parent. Negative `x` offset pushed them off-screen. | Wrap each in `inset-0 flex items-center justify-center` overlay → motion.div translates from centre. |
| Books fade in but don't move (look like they're just fading) | Opacity + spread shared the same scroll range — by the time they were visible they were already at final position. | Decouple ranges: opacity 8-14%, spread 14-55%. |
| Scroll-linked animation jittery | Raw `scrollYProgress` updates per-frame with input noise. | `useSpring(scrollYProgress, {stiffness:120, damping:30, mass:0.4})` before deriving transforms. |
| Navbar logos not at edges | `Container` adds max-w-7xl + horizontal padding. On wide screens, items inset. | Drop Container; `w-full px-4 sm:px-6`. |
| Limbs invisible in dark mode | Hardcoded FACE_STROKE (dark) against dark page bg. | Stroke switched to `var(--foreground)`. |
| Many late commits had stale BUILD-JOURNAL | Edit() requires Read() first; missed several times. | Lesson: Read journal section before Edit. Discipline gap caught + flagged. |
| Books read as "far back on z-axis" after spread bump (e5fb59e) | Side cards shrank to md + offsetX jumped to 260+(d-1)*160 + rotateY -22°. Combined effect: small + tilted + far. | Issue #46 (`0007920`): restore size=lg, offsetX 200+(d-1)*100 (layered) / 220+(d-1)*110 (scroll), rotateY -15, scale 0.94−depth*0.04. |

### Closed issues in this phase

#1, #16, #17, #19, #22, #23, #24, #25, #26, #27, #28, #29, #30, #31, #32, #33, #34, #35, #46, #47, #48, #51.

### Closed at end of Phase 1.6 (user-verified)
- **#47** — discount badges gone from /store, /ibdp, /igcse.
- **#48** — bookworm round 4 looks right.
- **#51** — re-clicking same nav link no longer hides books.

### Still open
- **#7** — Google OAuth deferred to Phase 7. Secret in env + supabase restart clean, but end-to-end sign-in still fails. Needs clean repro before next attempt.

### Pre-Phase-3 audit (2026-05-27)
Full codebase sweep before moving to cart + payments:
- ✅ tsc strict clean. ✅ eslint clean (after fixes below).
- ✅ Zero `any` / `as any` in src/.
- ✅ Zero `React.Children.only()` (React 19 / Turbopack landmine).
- ✅ Zero Framer in operational/admin route trees.
- ✅ Zero `tailwind.config.*` files (Tailwind v4 CSS-first respected).
- ✅ Zero hard-coded `sk_` / `rzp_live_` / `Bearer` literals.
- ✅ All 14 tables have RLS + at least one policy. 33 policies total.
- ✅ All `next/image` calls have `sizes` prop.
- ✅ Server Actions return discriminated union, no throws on user paths.
- ✅ Middleware gates /admin, /dashboard, /checkout.
- ✅ `ai@gravity.fast` only appears in git config — ADMIN_EMAILS uses shubhamhelpseries@gmail.com.
- 🟡 False alarm: agent flagged books_public_select RLS as broken (`published` vs `is_active`). Migration 20260526163830 drops the old policy on line 36 before renaming the column, then recreates with `is_active`. Order is correct.
- Fixed: theme-toggle.tsx React 19 `set-state-in-effect` lint error → useSyncExternalStore.
- Fixed: unused CardHeader imports in legal/page.tsx + curriculum-tabs.tsx.
- Fixed: CurriculumTabs empty states upgraded to `<EmptyState>` (§11).
- Deferred (filed): #49 unify console.error in query helpers (Phase 8). #50 migrate middleware → proxy naming (Phase 9).

### Workflow lesson (2026-05-27, captured to memory)
Don't auto-close issues with `Closes #N` in commit messages until the
user has visually confirmed the fix. Always reopen issues open + hand
the user explicit "open URL X, look at Y" instructions before closing.
Saved as `feedback_verify_before_closing.md` in the project memory dir
so future sessions inherit the rule.

### Open follow-ups
- Mascot scenes still don't fully sell "sitting/hanging" — user acknowledged this is okay to defer.
- Real PDF + audio streaming behind the locked tabs = Phase 4.
- Order CTA wires up in Phase 3 (cart + Razorpay).
- Inventory seed values are 0 → admin reports "7 titles below 5". Seed real stock numbers when convenient.

---

## Phase 3 · Payments, discounts, shipping

**Status:** In progress — 3.2 cart shipped, Razorpay/discount/shipping pending.

### Phase 3.2 — cart Server Actions + /cart shell (commit `_pending_`)

Decisions locked with the user before code: cart lives in the
**Supabase carts table** (not localStorage); merge guest cart into
user cart on sign-in (not replace, not prompt); add-to-cart buttons
**inline on existing cards** (no PDP detail pages for v1).

Shipped:

- `src/lib/cart/session.ts` — anonymous-session cookie helper
  (`adv_cart_session`, HttpOnly, 1-year max-age, secure in prod).
- `src/lib/cart/queries.ts` — `resolveCartOwner` (user_id beats anon
  cookie when both present), `findCartForOwner`,  `getOrCreateCart`,
  `getCartWithItems`, `getCurrentCart`, `getCurrentCartItemCount`.
  Uses the service-role client + explicit ownership checks (anon
  RLS would need a `set_config` per request).
- `src/actions/cart.ts` — `addToCart` (upserts on collisions, caps
  at qty 99), `updateCartItemQuantity` (0 removes), `removeCartItem`,
  `mergeAnonymousCartIntoUserCart` (re-attaches or merges line by
  line, deletes anon cart, clears cookie). All return the project
  discriminated union per CLAUDE.md §4.
- `src/components/features/store/add-to-cart-button.tsx` —
  client button with pending / just-added / default states and a
  sonner toast on error.
- `src/components/features/store/cart-line-row.tsx` — qty stepper
  (+/− with tabular-nums display) + trash button + per-line subtotal.
- `src/app/(storefront)/cart/page.tsx` — `/cart` page. Empty state
  via `<EmptyState>` (§11). Hydrated list, subtotal, disabled
  Checkout button pending Phase 3.1 Razorpay wiring.
- Wiring: `StoreListing` and `CurriculumTabs` `OrderBookCard` now
  use `<AddToCartButton>` instead of the disabled
  "Order — coming soon" placeholder. Navbar cart icon links to
  `/cart` + shows a brand-coloured count badge (server-fetched once
  per render via `getCurrentCartItemCount`).
- Auth hooks: `/auth/callback/route.ts` and `src/actions/auth.ts`
  signIn both call `mergeAnonymousCartIntoUserCart` post-auth. Best-
  effort — caught and swallowed so a merge failure can't block
  sign-in (idempotent on retry).

### Errors hit during 3.2

| Symptom | Fix |
|---|---|
| TS error inserting into `carts` with a discriminated-union literal | Widen explicitly to `{ user_id: string \| null; anonymous_session_id: string \| null }`. The DB CHECK constraint still enforces exactly one is non-null. |
| Stale "Order — coming soon" disabled `Button` in CurriculumTabs leaves `Button` import as the last user → still needed for `LockedAccessCard`'s Locked button. No prune needed. | n/a |

### Open follow-ups for 3.2

- Inventory `stock_count` is not yet decremented on `addToCart` —
  we hold stock at payment-success time only. This means cart count
  could exceed available stock. Need to add a pre-checkout availability
  check + a "low stock" badge on the cart line. File when wiring 3.1.
- No "minicart" drawer yet — clicking the navbar bag goes straight
  to `/cart`. Drawer is a nice-to-have, defer until after 3.1 ships.

### Phase 3.1 — Razorpay checkout (shipped 2026-05-27)

End-to-end checkout flow with HMAC-verified payment + coupon
redemption. User has Razorpay test keys in .env.local (23-char
key_id + 24-char secret); webhook secret to be pasted after
adding webhook in dashboard (SETUP-PHASE-3.md step 3).

**Database (migration 20260527010000):**
- SECURITY DEFINER `preview_coupon(code, user_id, eligible_subtotal_paise)`
  — read-only validity + discount check used by checkout UI.
- SECURITY DEFINER `redeem_coupon(code, user_id, order_id, eligible_subtotal_paise)`
  — atomic redemption with `SELECT … FOR UPDATE`. Insert into
  coupon_redemptions + bump `uses_count` in one transaction. Closes
  security audit #6 (enumeration via public SELECT — that policy is
  now DROPPED) and #7 (race condition).
- Seeded `student10` + `teacher10` as global 10% coupons (one
  redemption per user enforced via existing UNIQUE constraint).

**Server-side:**
- `src/lib/razorpay/client.ts` — lazy-instantiated Razorpay SDK
  wrapper. Throws a clear "see SETUP-PHASE-3.md" error if keys are
  missing.
- `src/actions/checkout.ts` — `createRazorpayOrder` (auth gate,
  cart lookup, totals math, pending_payment order insert,
  order_items snapshot, atomic coupon redeem via RPC, Razorpay
  order create, returns ids for client) + `verifyPaymentAndCompleteOrder`
  (constant-time HMAC verify, flips order to 'paid', stamps
  payment_id + signature, clears cart, revalidates).
- `src/app/api/webhooks/razorpay/route.ts` — Razorpay webhook
  receiver. Constant-time HMAC verify against raw body BEFORE
  parsing JSON. Idempotent handlers for `payment.captured`,
  `payment.failed`, `refund.processed`. Returns 503 if
  WEBHOOK_SECRET not yet configured (loud failure beats silent
  ignore), 401 for bad sig, 200 otherwise.

**UI:**
- `/checkout` page — auth gate (`redirect("/sign-in?next=/checkout")`
  for guests), empty-cart EmptyState fallback, line-items summary,
  CheckoutForm slot. Hard-coded ₹0 shipping + ₹0 GST until Phases
  3.3 / 3.5.
- `src/components/features/store/checkout-form.tsx` — client. Loads
  `checkout.razorpay.com/v1/checkout.js` via next/script (lazyOnload),
  coupon + pincode inputs, "Pay with Razorpay" button triggers
  createRazorpayOrder → opens Razorpay modal → handler calls
  verifyPaymentAndCompleteOrder → router.push to success page.
- `/order/[id]/success` page — receipt-style summary, line items,
  breakdown (subtotal / discount / shipping / GST / total), CTAs
  back to /dashboard + /store.

**Errors hit during 3.1:**

| Symptom | Fix |
|---|---|
| TS error: `Stack gap={0.5}` not in CVA scale | Changed to `gap={1}`. Should add `0.5` to scale if we use it more. |
| TS error: FormField has no `htmlFor` / `helper` props | FormField uses `description` (not `helper`) and auto-generates ids via `useId`. Dropped htmlFor + renamed prop. |
| `pnpm build` failed: "RAZORPAY_KEY_ID must start with rzp_live_ in production" | Local `pnpm build` runs with NODE_ENV=production, but we're using test keys. Tightened the validator refinement to gate on `VERCEL_ENV === "production"` instead of `NODE_ENV === "production"` — local CI/build passes, real Vercel prod deploy still enforces rzp_live_. |

**Manual test path (for user):**
1. `pnpm dev` (already running in bg).
2. Visit /store → add a book → /cart.
3. Click /cart → "Checkout — coming with Razorpay" button is now
   replaced with a real link via the navbar bag → /checkout.
4. /checkout shows cart summary + coupon input + pincode input +
   "Pay with Razorpay" button.
5. (Optional) Type `student10` in the coupon field.
6. Click Pay → Razorpay test modal opens.
7. Use a test card from https://razorpay.com/docs/payments/payments/test-card-details/
   (e.g. 4111 1111 1111 1111, any future expiry, any CVV).
8. On success → redirect to /order/<id>/success with receipt.

**Not yet wired (deferred):**
- Webhook secret in .env.local + Razorpay dashboard webhook URL
  (SETUP-PHASE-3.md step 3). Local checkout works without it —
  the inline verify is the primary path; webhook is the backup.
- Cart link on /cart page itself (still says "Checkout — coming
  with Razorpay" — needs a follow-up edit to link to /checkout).
  Files: src/app/(storefront)/cart/page.tsx.

### Phase 3.1 follow-up — coupon timing + receipt + sign-in (commit `b62682d`)

Triggered by user feedback after the first checkout test:
"student10 and teacher10 are not a onetime use coupon code and also
do not consider a coupon code to be used until and unless a
purchase has been made".

**Migration 20260527020000:**
- Added `coupons.multi_use_per_user` boolean (default false).
- Flagged `student10` + `teacher10` as multi-use per user.
- Dropped `UNIQUE(coupon_id, user_id)` constraint on
  `coupon_redemptions` (re-enforcement happens inside the RPC,
  conditional on the new column).
- Added `orders.coupon_code` so the post-payment redeem path knows
  which code to honour.
- Rewrote `preview_coupon` + `redeem_coupon` to skip the
  "already redeemed" check for multi-use codes.

**Code:**
- `createRazorpayOrder` now calls `preview_coupon` (read-only) and
  stashes the code on the order. No redemption row written yet.
- `verifyPaymentAndCompleteOrder` calls `redeem_coupon` AFTER the
  paid-flip. If post-payment redeem fails (race on single-use
  vendor code), we log to `order.notes` for admin reconciliation
  but don't fail the customer's transaction.
- `PrintReceiptButton` + print CSS in `globals.css` give a clean
  black-on-white receipt save-as-PDF path (Issue #77).
- Sign-in next-param bug fixed: `sign-in-form.tsx` hard-coded
  `router.push("/")` ignoring `?next=`. Now reads
  `useSearchParams()` + `safeNext()` open-redirect guard. Also
  threaded `next` through the Google OAuth path via
  `signInWithGoogle(next)` + `redirectTo` query param. (Was the
  actual cause of Issue #79 "Pay button fails for non-admin" —
  non-admin user signed in then bounced to `/` instead of back
  to `/checkout`.)
- Added `console.error` debug logging in `checkout-form.tsx` so
  future failures surface clearly in browser devtools.

### Closed (user-verified)

- **#79** — Pay button bug for non-admin (resolved by sign-in
  next-param fix).

### Awaiting user visual sign-off

- **#77** — receipt print/save-as-PDF
- **#78** — coupon multi-use + redeem-on-payment

### Phase 3.1 wrap-up — Amazon notice + Shiprocket swap (2026-05-28)

Two follow-ups closed out the 3.1 box:

- **Amazon notice (Issue #80):** subtle inline caption under the
  coupon input on /checkout — "Codes apply on this website only —
  Amazon orders aren't eligible." Always visible, no extra state.
- **Shiprocket swap (Issue #81):** user confirmed they're on
  Shiprocket, not Delhivery. Renamed every reference in code, env
  vars, .env.example, FFR, roadmap, and storefront copy (legal/terms,
  cart page, home pillars, success page, checkout-form helper). New
  env vars: SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD (Shiprocket mints
  a 10-day JWT via /external/auth/login — no static API key).
  Roadmap §3.3 rewritten around Shiprocket's API surface
  (serviceability + rate quote, create order, AWB tracking).

Phase 3.1 roadmap box is now fully ticked (Razorpay order create +
HMAC webhook + global discounts + Amazon notice). 3.3 implementation
(actual Shiprocket calls) is blocked on user providing dashboard
email/password for the test sandbox.

### History rewrite — Sale_*.pdf scrubbed (2026-05-28)

User-uploaded Vyapar invoice `Sale_18_08-05-2026.pdf` (contains
mom's address + SBI account number) was accidentally committed in
the "fix mobile hero" commit, then removed in a follow-up. Both
commits were force-pushed.

Vendor details deemed sensitive enough to scrub from history. Ran
`git filter-repo --invert-paths --path Sale_18_08-05-2026.pdf` +
`git push --force-with-lease origin main`. Every commit from the
PDF-introducing one onward got a new hash; older commits unchanged.
PDF blob is gone from all reachable history on local + remote.

Verified: `curl -I .../raw/main/Sale_18_08-05-2026.pdf` returns
404. `git cat-file -e 166a500` (the old hash) fails.

`.gitignore` already hardened with `Sale_*.pdf` / `Invoice_*.pdf` /
`*.invoice.pdf` patterns in `aaac5b2` (pre-rewrite). Future user-
dropped invoices stay local-only.

### Mobile hero fix + Tax Invoice spec (2026-05-28)

**Issue #82 (P1 bug):** Homepage hero animation was broken on phones
< md (768px). `LayeredBookHero` and `ScrollRevealHero` both use
fixed-px `offsetX` (220–440px) for side cards. On a 360px-wide
phone the centre book fills almost the whole viewport and the side
books translate fully off-screen — and the scroll-reveal's outer
`min-h-[300vh]` produced 3 screens of empty scroll. Fix: wrapped
side-book renders in `<div className="hidden md:contents">` in
both hero components; reduced the scroll-reveal outer to
`min-h-[80vh] md:min-h-[300vh]` so mobile has a normal-height
hero with just the centre book.

**Issue #83 (P1 feature):** User dropped `Sale_18_08-05-2026.pdf`
in the repo root — their existing Vyapar Tax Invoice format. Spec:
generate the same layout server-side post-payment, replace the
print-CSS workaround from #77. Filed with a full layout reference
(seller block, bill-to, line items table with HSN/SAC + per-line
discount, totals + amount-in-words, bank details, terms). Roadmap
gains Subphase 3.6 (Tax Invoice PDF generation): sequential
`invoice_number` + `invoice_generated_at` columns, `books.hsn_sac`
column (default 4901, 0% GST), `src/lib/invoice/render.ts`,
`/api/orders/[id]/invoice.pdf` route, replaces PrintReceiptButton.
Phase 7 attaches the PDF to the receipt email.

`NEXT-PROMPT.md` rewritten for the upcoming `/clear` — points at
the new lean HANDOFF, the queued "Next up" list at the bottom of
this journal, the two user-blocking items (#7 OAuth + #81
Shiprocket creds), and the workflow rules captured to memory.

### Phase 5.1 — Admin orders UI (2026-05-29)

First operational surface Mom can actually use to fulfil real
orders. Mobile-first because she packs on her phone.

**Schema (migration `20260528175144_admin_orders_extend_status_tracking.sql`)**

- Extended `order_status` enum with `on_hold` and `partially_refunded`.
  Postgres can't drop enum values, so existing rows + RLS policies
  are unaffected.
- Added `orders.tracking_number`, `courier_name`, `delivered_at`,
  `on_hold_at`, `refunded_at`, `admin_notes`. The structured
  `(tracking_number, courier_name)` pair supersedes the free-text
  `tracking_url` for new code; the URL column stays for the receipt
  page link.
- Two SECURITY DEFINER RPCs: `update_order_status(p_order_id,
  p_new_status, p_notes)` and `set_order_tracking(...)`. Both
  re-check `is_admin()` server-side, stamp the matching `*_at`
  timestamp, and write an `admin_audit_logs` row on every flip —
  defence-in-depth on top of the middleware admin gate.

**Server actions (`src/actions/admin-orders.ts`)**

- `listOrders({ status?, search?, from?, to?, page? })` — paginated
  (25/page). Foreign-table join to `users` for customer name/email;
  pulls `shipping_address.city` from JSONB. Search ilike's on
  `order_number`.
- `getOrderDetail(orderId)` — order + items (with book join) +
  customer.
- `updateOrderStatus(...)` and `setOrderTracking(...)` — thin
  wrappers around the RPCs. Both `revalidatePath` the list + detail
  so Mom sees the new state immediately.
- `getOrderStatusCounts()` — feeds the tab badges.
- Pure label helpers (`statusLabel`, `courierLabel`, the enum
  constants) live in `src/lib/orders/labels.ts` — a `"use server"`
  file can only export async functions, so non-async stays out.

**Admin shell (`src/app/(operational)/admin/layout.tsx`)**

- 56-px-wide left rail on md+, fixed bottom tab bar on mobile. Five
  nav items (Overview / Orders / Books / Coupons / Settings); Books,
  Coupons, Settings link to routes that don't exist yet — that's
  deliberate, they'll 404 until Phase 5.3 / 5.2 / 5.5.

**List page (`/admin/orders`)**

- Status tabs (All / Paid / Packed / Shipped / Delivered / On hold /
  Refunded / Cancelled) with counts. Search input (`?q=`). Date range
  (`?from`, `?to`). Loading / empty / error states (empty copy
  differs when filters are active). Mobile row layout, pagination.

**Detail page (`/admin/orders/[id]`)**

- Customer block + shipping block with one-tap copy buttons (copies
  formatted plain-text address — paste straight into Shiprocket or
  WhatsApp).
- Line items with cover thumbs + totals breakdown (subtotal, discount
  with coupon code if present, shipping, GST, total).
- Tracking capture: number + courier dropdown + optional URL.
- Right rail: primary button auto-advances to the next state (paid →
  Packed → Shipped → Delivered) plus a status dropdown for arbitrary
  jumps (on_hold, refunded, cancelled). Timeline of `*_at`
  timestamps. Razorpay payment ID footer card.
- Print invoice button reuses `PrintReceiptButton` — same interim
  flow as `/order/[id]/success`. Replaced with the Vyapar generator
  in Phase 3.6 (#83).

**Open items**

- Migration `20260528175144` is NOT yet pushed to the remote Supabase
  project (CLI not linked locally this session). Pages render fine
  against the existing schema, but the new status values + tracking
  columns + RPCs only become usable after the push. User action at
  the top of the next session: `./scripts/supabase-with-env.sh
  link --project-ref <ref>` then `./scripts/supabase-with-env.sh db
  push`, then regenerate types.
- `as never` casts on the two new RPC names and `as unknown as
  Tables<…>["status"]` on `on_hold` filtering drop out automatically
  once the types regenerate.
- Issue #61 stays open — only C3a (list) + C3b (detail) shipped this
  round. C3c CSV exports + the "Mark as Shipped" email modal are
  still TODO. Wait for user visual sign-off per
  `memory/feedback_verify_before_closing.md` before closing.

### Phase 5.1 follow-up — abandoned-cart filter + local migration (2026-05-29)

User testing flushed out two things on the new admin orders UI:

1. **Status dropdown was a no-op.** Root cause: the
   `20260528175144_admin_orders_extend_status_tracking.sql` migration
   hadn't been applied to the running local Supabase stack (the local
   Docker stack was up, but `db reset` / `migration up` wasn't run
   after I dropped the file). Applied via
   `docker exec -i supabase_db_advaita psql -U postgres -d postgres <
   supabase/migrations/20260528175144_…sql` — `ALTER TYPE / ALTER
   TABLE / CREATE FUNCTION` all returned cleanly. Verified enum
   contains the new `on_hold` and `partially_refunded` values.

2. **Abandoned checkouts polluted the "All" tab.**
   `createRazorpayOrder` inserts a row with status `pending_payment`
   before the Razorpay modal even opens. If the user closes the modal
   without paying, the row sits forever as an "unpaid" order. Fix:

   - `listOrders` now `.neq("status", "pending_payment")` when no
     explicit status filter is set.
   - `getOrderStatusCounts.all` mirrors the same exclusion.
   - `OrdersFilters` shows an extra "Abandoned" tab ONLY when
     `counts.pending_payment > 0` (or the user has navigated to
     `?status=pending_payment` directly). When Mom has no abandoned
     rows, the tab is invisible — no distracting empty state.

   Filed Issue #84 with the v2 follow-ups: scheduled auto-cancel of
   stale `pending_payment` rows after Razorpay's 30-min order TTL,
   and a possible architectural change to defer the orders INSERT
   until `payment.captured` webhook fires.

3. **`.env.local` parsing — # in passwords.** Heads-up captured in
   the response: dotenv treats `#` as a comment delimiter unless
   the value is quoted. Wrap secrets containing `#` (or any of
   `$`, `\`, `"`, spaces, `=`) in single quotes:
   `SHIPROCKET_PASSWORD='ab#cd!ef'`.

### Phase 3.3 — Shiprocket integration (2026-05-29)

Shiprocket auth + live quote at checkout + auto-create on Packed,
shipped end-to-end against the user's account. Token verified locally
(HTTP 200, 400-char JWT).

**Schema (`20260528230755_books_shipping_dimensions.sql`)**

- Adds `weight_grams int default 300` and `length_cm / breadth_cm /
  height_cm numeric(5,1)` with school-book defaults (22 × 15 × 2 cm).
- All `NOT NULL DEFAULT` so existing rows backfill cleanly. Mom
  overrides per-book once Phase 5.3 admin CRUD ships.
- Applied to local Supabase via Docker psql.

**Client (`src/lib/shiprocket/client.ts`)**

- Lazy `getToken()` with 9-day in-memory cache + promise-lock so
  concurrent cache-miss calls share one login.
- `getServiceability(pincode, weightGrams)` — returns array of
  couriers + `cheapest` (lowest non-zero `rate`).
- `createOrder(...)` — POSTs to `/orders/create/adhoc`. Returns
  shipment_id (+ awb_code/courier_name if Shiprocket auto-assigned).
- `assignAwb(shipmentId)` — fallback when create didn't auto-pick.
- `pingShiprocket()` — health-check for a future admin "Test
  connection" button.
- `ShiprocketError` carries status + raw body for diagnostics.

**Env (`src/lib/env.ts`)**

- New optional: `SHIPROCKET_PICKUP_PINCODE` (6-digit regex),
  `SHIPROCKET_PICKUP_LOCATION` (default `"Primary"`).
- `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` were already wired but
  never used; this commit consumes them.

**Server action (`src/actions/shipping.ts`)**

- `getShippingQuote({ pincode })` — sums `weight_grams × qty` across
  the current cart, calls Shiprocket, returns cheapest rate +
  courier name + ETD. Discriminated union return. Graceful error
  copy when Shiprocket throws.

**Checkout form (`src/components/features/store/checkout-form.tsx`)**

- Pincode input is now controlled. On every change with a valid
  6-digit value, debounce 500 ms → `getShippingQuote`.
- Quote state derived from `(currentPincode, lastAsyncResult)` —
  React 19's `set-state-in-effect` rule forbids the previous
  synchronous setState approach, so the effect only writes inside
  the timer callback.
- Subtotal / Shipping / Total breakdown live in the form. Shipping
  line shows "Quoting…" spinner, then `₹X via {courier} · ETA …`,
  or a destructive caption if the pincode is unserviceable.

**Checkout server action (`src/actions/checkout.ts`)**

- `createRazorpayOrder` re-fetches the quote server-side and uses
  the real rate so a tampered client price can't override it. Falls
  back to ₹0 (and logs) if Shiprocket is down — checkout still
  works; Mom absorbs the cost in that rare case.

**Admin Mark-as-Packed (`src/actions/admin-orders.ts`)**

- `updateOrderStatus` fires a best-effort `autoCreateShiprocketOrder`
  side-effect when `newStatus === "packed"`. The helper:
    - Bails early if the order already has a `tracking_number`
      (idempotent on packed → shipped → packed cycles).
    - Pulls items + book dims + customer + shipping address.
    - Computes total parcel weight + uses max of each per-book dim
      as parcel dim.
    - Calls `createOrder` → `assignAwb` (if no awb yet) → patches
      `orders` with `tracking_number / courier_name / tracking_url`.
    - All errors logged, never thrown — Mom can still flip the
      status and fill the TrackingForm manually.

**Open items**

- Production note: fire-and-forget side-effect from a Server Action
  is fine on a Node runtime but can be killed mid-execution on
  Vercel Edge if the function returns before it finishes. Move to a
  queue (or inline+await) before going live.
- Settings.free_shipping_enabled / "free if quote < ₹100" rule is
  NOT wired here. Roadmap rows left unchecked. Lands with Phase 5.5
  admin settings UI.
- TypeScript casts to read `weight_grams` etc. from `books` rows
  drop out automatically once `supabase gen types` regenerates.

### Phase 3.3 follow-up — checkout UX hardening (2026-05-30)

User-driven follow-ups after seeing the live checkout:

1. **Live discount preview.** Previously the discount only showed up
   on the Razorpay screen — surprising. New action
   `previewCheckoutTotals({ couponCode?, pincode? })` mirrors the
   math inside `createRazorpayOrder` (subtotal, coupon preview,
   shipping quote, total) but inserts/redeems nothing. Checkout
   form debounces 500 ms on either input and shows: `Subtotal ·
   Discount (CODE) − ₹X · Shipping via Bluedart ETA … · Total`.
   Coupon-invalid messages (expired, wrong user, etc.) render
   inline below the input so the user sees them BEFORE clicking
   Pay. Subtotal stays a server-side prop so the displayed
   discount-eligible logic doesn't leak the cart math to the
   client. `createRazorpayOrder` is still the source of truth —
   the preview is advisory.

2. **Disable Pay when blocked.** Computed `blockedReason` string
   covers: missing pincode, still quoting, unserviceable pincode,
   invalid coupon, preview error. Pay button is disabled with a
   caption underneath telling Mom-the-customer what's wrong. The
   "No couriers serve this pincode" copy renders in destructive
   colour next to the Shipping line so the user sees the
   problem AT the input, not just at the button.

3. **Razorpay-modal dismiss cleanup.** New `cancelPendingOrder`
   action: owner-only, marks the pending_payment order as
   cancelled. Wired into the modal's `ondismiss` so abandoned
   checkouts get marked cancelled immediately. This complements
   the "all-tab excludes pending_payment" filter from Phase 5.1
   follow-up — now we ALSO actively clean up instead of just
   hiding. The "Payment in progress — don't close this window"
   notice renders during the active modal window.

4. **Filed for later (not in this commit):**
   - #85 — Customer-selectable shipping partner at checkout (fast
     vs cheap).
   - #86 — Free shipping toggle + auto-free-under-₹100 rule
     (deferred from Phase 3.3 originally).
   - #87 — Shiprocket webhook → auto-update order status (huge
     ops win; eliminates manual status flips for in-transit /
     delivered events).
   - #88 — Production fire-and-forget risk for the
     `autoCreateShiprocketOrder` side-effect (must close before
     launch).
   - #89 — Mark-as-Shipped customer email with AWB (Phase 7
     Resend dependency).

### Phase 3.6 — Tax Invoice PDF generation (2026-05-30)

Replaces the print-CSS hack (PrintReceiptButton, Issue #77) with
a real server-rendered Vyapar-style invoice. Mom can give these
out for GST records without a screenshot detour.

**Schema (`20260530133804_invoice_number_sequence.sql`)**

- `invoice_number_seq` sequence + `next_invoice_number()` SECURITY
  DEFINER allocator. Format: `ADV/YYYY-YY/NNNN` (e.g.
  `ADV/2026-27/0001`). Fiscal year computed from `current_date` —
  months 4–12 → `YYYY-(YY+1)`, months 1–3 → `(YYYY-1)-YY`.
- `orders.invoice_number` (text, unique) + `orders.invoice_generated_at`.
  Idempotent — re-rendering an existing invoice never reallocates.
- `books.hsn_sac` (default `'4901'` — printed books, 0% GST).
- Applied to local Supabase via Docker psql. Verified allocator
  returns `ADV/2026-27/0001` and `0002` on consecutive calls.

**Renderer (`src/lib/invoice/render.ts`)**

- pdfkit-based. ~600 KB dep, server-only, no client bundle hit.
- A4 portrait, 36 pt margins.
- Sections (top → bottom): Header (seller block + Tax Invoice
  title + meta) → Bill To → Items table (8 columns) → Totals box
  (right-aligned, 240 pt wide) → Amount in Words → Terms + Bank
  Details two-column → Footer.
- Item table columns: `# | Item Name | HSN/SAC | Qty | Unit |
  Price/Unit | Discount | Amount` — widths sum to CONTENT_W (523 pt).
- Shipping renders as its own line (HSN blank, "Pcs" unit).
- Order-level discount pro-rated across line items by share of
  subtotal so per-line Disc column sums to order discount.
- `amountInWordsINR` uses Indian lakh + crore grouping
  (12,34,567 → "Twelve Lakh Thirty Four Thousand Five Hundred Sixty
  Seven Rupees Only").
- `RUPEE = "Rs."` fallback — pdfkit's bundled Helvetica lacks the
  ₹ glyph and would render tofu. Swap to a bundled DejaVu font in a
  follow-up if we want the real symbol.
- Bank details hardcoded to SBI Marathahalli / ***REDACTED*** /
  ***REDACTED*** per the spec PDF.

**Route (`/api/orders/[id]/invoice.pdf`)**

- AuthN: signed-in user required.
- AuthZ: owner OR admin (via `isAdminEmail`).
- Allocates `invoice_number` on first hit via the RPC; subsequent
  hits reuse the stamped value. `invoice_generated_at` stamped on
  first hit too.
- Streams as `application/pdf` inline, filename
  `invoice-ADV-2026-27-0001.pdf` (slashes swapped to hyphens for
  filesystem-friendly naming).
- Wraps the Buffer in a single-chunk ReadableStream to satisfy
  NextResponse's BodyInit typing.

**UI swap**

- New: `src/components/features/store/invoice-download-button.tsx` —
  thin asChild Button wrapping an `<a target="_blank">` to the
  route.
- Old: `print-receipt-button.tsx` deleted entirely. No more
  PrintReceiptButton references in the tree.
- Wired into `/order/[id]/success` and `/admin/orders/[id]`.

**Open / follow-up**

- The seller block has Mom's address as placeholders
  ("Bengaluru, Karnataka / India" + a `+91 99999 00000` phone
  stub). Need real values — Mom should send the canonical address
  + phone she wants on invoices. Filed nothing yet — flag at end
  of next session.
- ₹ symbol → `"Rs."` text fallback because pdfkit's Helvetica
  can't render it. Bundling a Unicode-friendly font would fix it
  but adds ~300 KB; not urgent.
- The `as never` RPC cast and the `as unknown as { invoice_number
  ... }` widening on the `orders` row drop out once
  `supabase gen types` regenerates.
- Phase 7 hook (attach invoice to Resend email) tracked under #89.

### Phase 3.6 + 5.1 follow-ups (2026-06-01)

User testing flushed out three things:

1. **Invoice download returned `{"error":"Render failed"}`.** Root
   cause: pdfkit's `.afm` font metric files are loaded at runtime
   via `fs.readFileSync` from relative paths inside the package.
   Next/Turbopack tree-shakes them out of the bundle so the
   renderer throws `ENOENT data/Helvetica.afm`. Fix: added
   `serverExternalPackages: ["pdfkit"]` to next.config.ts — leaves
   pdfkit untouched in node_modules. Same gotcha applies to any
   library that reads data files at runtime (canvas, sharp etc.).
   Also: route now returns the real error message in `NODE_ENV !==
   "production"` so the next time this kind of thing happens we
   see it immediately instead of "Render failed".

2. **`/order/[id]/success` 404'd when user pasted the
   `order_number`** (`ADV-YYYYMMDD-XXXXX`) instead of the UUID.
   The normal flow redirects with the UUID — but receipts /
   invoices show the order_number, so users naturally try to paste
   that. Fix: success page + invoice route now accept EITHER. UUID
   regex disambiguates. Backwards compatible.

3. **Mark-as-Packed not auto-filling AWB.** Diagnosis blocked by
   silent log → the failure mode wasn't visible to user. Fixes:
   - `autoCreateShiprocketOrder` now logs the SPECIFIC missing
     field when bailing on incomplete shipping address
     (hasLine1 / hasCity / hasPincode / hasPhone).
   - When Shiprocket's `createOrder` API rejects the payload, the
     error log now prints `status` + raw response body so we can
     see what Shiprocket said (was just printing the Error
     instance).
   - Filed Issue #92 to track the underlying bug + collect log
     output after user retests.

**Issues filed in this round:**

- #90 — Mobile responsiveness pass before launch (P0, blocking).
  Marked very important per user.
- #91 — Complete UI revamp design pass.
- #92 — AWB auto-fill bug (this commit's logging will surface the
  cause).

### Next up

1. **Phase 5.1 follow-up** — inventory UI + CSV exports + customer
   lookup (the rest of #61's punch list).
2. **Phase 5.5 Admin allowlist + settings UI** (#10) — also wires
   the free-shipping toggle (#86) and lets Mom edit invoice seller
   address.
3. **#87 Shiprocket status webhook** — high ops impact, eliminates
   manual status flips for in-transit / delivered.
4. **3.5 GST/tax** at checkout.
5. **3.4 Refund webhook expansion** + admin refund button.
6. **Phase 4** — R2 + watermarked PDF + audio streaming.
7. **Phase 8.7 security P0s** — admin gate drift (#74, #75).
8. **#90 Mobile responsiveness** — must close before launch.
9. **#91 Complete UI revamp** — final sprint polish.

---

## Backlog expansion (2026-05-27)

Spawned two background agents to widen the issue tracker before
Phase 3.1 starts:

**FFR sweep (21 new issues, #53–#73)** — every FFR sub-section that
isn't already shipped/tracked got an issue:
- A5/A6 storefront PDP + checkout flow (#53, #54)
- A7/A8 community + feedback forms (#55, #56)
- B1–B4 customer dashboard (#57, #58, #59)
- C2–C10 admin command center (#60–#68)
- Phase 7 transactional emails umbrella (#69)
- New user asks: sales reports (#70), analytics (#71), Excel
  export (#72), local Ollama AI assistant (#73)
- Created missing labels phase/3, phase/4, phase/6, phase/10.

**Pre-Phase-3 security audit (21 findings, 2 P0 + 11 P1 + 5 P2 + 3
P3-deferred)** — full report below; tracking via umbrella #76 plus
individual #74 #75 for the P0s. Re-runnable any time via the
`/security-audit` skill (`.claude/skills/security-audit/SKILL.md`).

### Pre-Phase-3 security audit (2026-05-27) — findings table

| # | Sev | Category | What's exploitable |
|---|-----|----------|-----|
| 1 | **P0** | Admin gate drift | middleware reads ADMIN_EMAILS env; `is_admin()` reads admin_emails DB → stale-env adds/revokes don't propagate. Issue #74. |
| 2 | **P0** | First-admin takeover | OTP fires for any env-listed email without DB verification. Issue #75. |
| 3 | P1 | Cart cookie | UUIDv4 acts as unsigned bearer token, 1-year TTL, no rotation. |
| 4 | P1 | CSRF | No explicit `experimental.serverActions.allowedOrigins`; SameSite=Lax on cart cookie. |
| 5 | P1 | Open redirect | `next=//evil.com` bypasses `startsWith("/")` in callback + middleware. |
| 6 | P1 | Coupon enumeration | Public SELECT on `coupons` lets anon dump every active code. |
| 7 | P1 | Coupon race | No SECURITY DEFINER `redeem_coupon()` — parallel POSTs can exceed `max_uses`. |
| 8 | P1 | Disposable email | Gmail dots/+suffix not canonicalized; IDN lookalikes pass. |
| 9 | P1 | Service-role in cart | All cart writes use service-role + code-level ownership check — no RLS backstop. |
| 10 | P1 | Sign-in error oracle | Raw Supabase errors forwarded to UI = account enumeration. |
| 11 | P1 | Headers absent | No CSP / HSTS / X-Frame-Options / etc. in next.config.ts. |
| 12 | P1 | No rate limiting | Sign-in / sign-up / OTP / addToCart all unthrottled. |
| 13 | P2 | Anon cookie hardening | `__Host-` prefix + rotation-on-auth missing. |
| 14 | P2 | Site URL trust | `resolveSiteUrl()` falls back to client-controlled Host header. |
| 15 | P2 | Mass assignment | signUp passes whole formData → auth.users.raw_user_meta_data. |
| 16 | P2 | content_submissions wide-open | Anon insert with `with check (true)`; no length cap, no captcha. |
| 17 | P2 | users.role dead code | Column writeable but no longer read by `is_admin()`. |
| 18 | P3 | Razorpay HMAC | Phase 3.1 — verify X-Razorpay-Signature in constant time + idempotency. |
| 19 | P3 | Streaming + watermark | Phase 4 — short-TTL signed URLs, per-request watermark. |
| 20 | P3 | File uploads | Phase 5.3 — MIME by magic-bytes, EXIF strip, store outside webroot. |
| 21 | P3 | Env exposure | Currently clean; keep `SERVICE_ROLE` out of `.next/static/**`. |

### Clean (no findings)
- ✅ No SQL injection surface (Supabase client parameterized throughout).
- ✅ No `dangerouslySetInnerHTML` anywhere.
- ✅ No `eval` / `new Function`.
- ✅ HttpOnly + Secure (prod) + SameSite=Lax on anon-cart cookie.

### `/security-audit` skill

`.claude/skills/security-audit/SKILL.md` defines the re-runnable
probe battery. Ten Python scripts (header check, open-redirect probe,
admin-gate bypass, SQLi, cart IDOR, coupon brute-force, disposable-
email bypass, rate-limit probe, dot-file exposure, XSS placeholder).
Default target localhost:3000. Refuses non-localhost / non-allowlist
hosts without explicit user confirmation. Output convention: one
line per probe with `OK` / `MISS` / `FAIL` / `LEAK` / `BYPASS` /
`SLOW` / `RACE` token; `grep -E '^  (FAIL|LEAK|BYPASS|RACE)'` gives
a clean exploit summary.

### Bookworm jitter (Issue #52)

Pupil amplitudes were sub-pixel (`x: [-1, 1.5, -1]`) on an SVG
sub-element that doesn't get the GPU layer a div wrapper gets →
visible flicker. Replaced 3-point keyframes with single-target
+ `repeatType: "reverse"`, bumped amplitude (`x: 3, y: -2` for
pupils; `y: -6, rotate: 3` for book) and pulled the book's
`initial` to `{ y: 0, rotate: -3 }` so the reverse motion starts
clean. Smoother sinusoidal feel, no jitter.

### Commit attribution rule change (2026-05-27)

Per user: drop the `Co-Authored-By: Claude …` trailer from commits
+ no "🤖 Generated with Claude Code" footer on PR bodies. Commits
already attribute to Shubham via the local git config; the trailer
just added noise. CLAUDE.md §14 updated; rule saved to memory at
`memory/feedback_no_co_authored_by.md`.
