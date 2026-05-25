# Build Journal — Advaita

Step-by-step log of what was done on this project (no code snippets).  
Errors, fixes, and how they were detected are called out when relevant.

**Repo:** https://github.com/ShubhamSachdeva311205/Advaita  
**Local path:** `/Users/shubhamsachdeva/Documents/Mom_Biness`

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
**Subphase 1.1:** Complete (Claude Code + pushed to GitHub). **1.2 / 1.3:** Pending.

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

- [ ] *(pending)*

### Subphase 1.3 — Page shells & layouts

- [ ] *(pending)*

---

## Phase 2–8

*Placeholder — journal sections will be appended when each phase begins.*
