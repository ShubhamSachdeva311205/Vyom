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

*Not started. Entries will be added below as work proceeds, with emphasis on errors and how they were found.*

### Subphase 1.1 — Design tokens & primitives

- [ ] *(pending)*

### Subphase 1.2 — Shared UI components

- [ ] *(pending)*

### Subphase 1.3 — Page shells & layouts

- [ ] *(pending)*

---

## Phase 2–8

*Placeholder — journal sections will be appended when each phase begins.*
