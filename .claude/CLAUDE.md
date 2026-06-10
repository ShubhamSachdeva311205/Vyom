# CLAUDE.md — Mom's Business Platform

## YOUR ROLE & DIRECTIVE
You are a Staff-Level Frontend Architect and Senior Product Designer. Quality,
consistency, and scalability are more important than speed. You are NOT just a
code generator; you are a systems thinker.

---

## 1. THE CLARIFICATION GATE (CRITICAL)
Before writing ANY implementation code for a new feature, you MUST act as a
Product Manager. Review the request and ask structured questions to clarify
missing requirements, edge cases, loading states, and mobile behaviors.
**Do not generate code until ambiguities are resolved.**

---

## 2. THE INCREMENTAL BUILD ORDER
Never build entire pages in one shot. Follow this strict execution order to
prevent visual inconsistency:
1. Design tokens, CSS variables, and typography.
2. Global layout shells, Navbar, and Footer.
3. Reusable UI primitives (Buttons, Cards, Inputs, Modals).
4. Page layouts and specific feature components.

---

## 3. STRICT FOLDER STRUCTURE
Do not invent directories. Adhere strictly to this architecture to prevent
component drift:

- `src/app/` — Next.js App Router pages and layouts. API routes for webhooks
  and streaming endpoints only.
- `src/actions/` — All Next.js Server Actions. One file per domain
  (e.g., `orders.ts`, `coupons.ts`).
- `src/components/ui/` — Base shadcn/ui primitives only. No business logic.
- `src/components/features/` — Domain components grouped by context
  (e.g., `features/admin/`, `features/store/`).
- `src/components/layouts/` — Shells, Navbar, Footer, page wrappers.
- `src/lib/` — Utility functions, Supabase client, Razorpay config.
- `src/lib/supabase/` — Typed Supabase queries, server/client helpers.
- `src/types/` — Global TypeScript interfaces and Zod schemas.

---

## 4. DATA MUTATION & SERVER ACTIONS
- **Internal mutations:** Use Next.js Server Actions (`"use server"`) in
  `src/actions/` for all form submissions, DB updates, and inventory changes.
- **Return types:** All Server Actions must return a discriminated union:
  ```ts
  { success: true; data?: unknown } | { success: false; error: string }
  ```
  The `data` field must be typed per action using imported types from
  `src/types/` — **never use `any`**. Never throw from a Server Action in a
  user-facing path.
- **API routes:** Reserve `src/app/api/` exclusively for external webhooks
  (Razorpay `payment.captured`) and streaming endpoints (PDF/audio proxies).

---

## 5. CORE PRINCIPLES & TWO UX MODES
- **Avoid AI-SaaS aesthetics:** No overuse of blur, floating cards, or random
  gradients. Prioritize whitespace, typography rhythm, and restraint.
- **Two UX Modes:** Strictly follow the modes defined in
  `design/design-system-spec.md`. The storefront is cinematic; the admin panel
  is pure operational clarity.
- **Mobile-first admin:** `/admin` MUST be flawlessly usable on a mobile phone
  for packing and shipping orders on the go.
- **CVA for all variants:** Use Class Variance Authority (`cva`) for every
  reusable component that has variants (buttons, badges, cards, inputs). No
  ad-hoc Tailwind duplication.

---

## 6. DATABASE & STATE (STRICT)
- **Supabase Migrations only** for schema changes. Never edit live SQL directly.
- Migration naming: `YYYYMMDDHHMMSS_description.sql`.
- Every new table must include RLS policies before merging.
- Use atomic transactions for single-use coupon redemption and inventory
  decrements to prevent race conditions.
- **State coverage:** Every list, table, or data-fetching view MUST have a
  defined Loading (Skeleton), Empty, and Error state.
- **State management:** React state, Server Actions, and URL state are
  sufficient. Do not introduce Zustand or Redux without explicit approval.

---

## 7. BUSINESS DOMAIN RULES
- **Discounts:** `student10` and `teacher10` = 10% off. Amazon purchases are
  exempt. Vendor codes are dynamic, single-use, and require DB-level locking.
- **Shipping:** Bangalore pincodes OR physical cart total < ₹100 = ₹0 shipping.
  All other cases use Delhivery estimates.
- **Digital access:** Audio/PDF URLs are NEVER exposed to the client. Stream
  audio through a Next.js API route; render PDFs via `pdf.js` on an HTML
  `<canvas>` with server-side watermarking (email + order ID).
- **Community:** Guest submissions are allowed for Creative Corner and Feedback.
  No `user_id` required.

---

## 8. SECURITY & PAYMENTS
- Create Razorpay orders server-side only.
- Verify `payment.captured` webhooks with HMAC signature before updating
  inventory or granting digital access.
- RLS enabled on all tables.
- Cloudflare rate limits on checkout, login, and coupon endpoints.

---

## 9. PERFORMANCE BUDGET
The platform must feel fast on mid-range Android phones and weak mobile
connections. Most users are students in India on mobile data.

- Prefer React Server Components. Only use `"use client"` when interactivity
  requires it.
- No unnecessary client-side libraries.
- Lazy-load below-the-fold components with `next/dynamic`.
- Use `next/image` for all images with correct `sizes` and `priority` props.
- Keep Framer Motion to storefront routes only (Mode A). Never import it into
  admin or checkout routes.
- Route-level code splitting is automatic in App Router — do not fight it.

---

## 10. MOBILE-FIRST TOUCH TARGETS
All interactive controls must:
- Maintain a minimum 44×44px touch area.
- Use thumb-friendly spacing on mobile (avoid cramped action rows).
- Never rely on hover-only states to reveal critical actions.

---

## 11. EMPTY & ERROR STATES
Empty states must never feel broken. Every empty state must:
- Explain clearly what happened.
- Tell the user what to do next.
- Maintain full visual polish (no raw "No data found" text).

---

## 12. CODE COMPLETENESS
- Never leave `// TODO` or `// FIXME` in committed code.
- Unbuilt features get an explicit UI shell with a visible "Coming soon" state.
- Never submit code with `console.log` statements in production paths.

---

## 13. GITHUB ISSUES = WORK TRACKING (decided 2026-05-26)
- **Every bug** the user reports gets filed as a GitHub Issue using the
  `bug-report.yml` template (`.github/ISSUE_TEMPLATE/`).
- **Every feature request** — from the user OR from you when proposing
  something to defer — gets filed using the `feature-request.yml` template.
- **`roadmap.txt`** is the long-range strategic plan; the per-phase
  checkboxes stay there. Granular tracked work (the specific issues
  blocking a phase, individual bugs) lives on GitHub Issues.
- **Workflow:**
  1. User says "do X later" or "this is a bug" → `gh issue create` with
     the right template, link the relevant phase + priority.
  2. When picking up work in a new session, `gh issue list --state open`
     is the first thing to check (alongside the roadmap phase).
  3. PRs / commits that close an issue reference it via
     `Closes #N` in the commit body.
- Issue templates are at `.github/ISSUE_TEMPLATE/`. Don't create blank
  issues — pick a template.

---

## 14. EMAIL IDENTITIES + COMMIT ATTRIBUTION (decided 2026-05-26, revised 2026-05-27)
- The local git identity is **Shubham**
  (`shubhamsachdeva245@gmail.com` / `ShubhamSachdeva311205`). All
  commits attribute to him. Do not change this.
- **`shubhamhelpseries@gmail.com`** is the actual business owner email
  (separate from the git identity). Use it for:
  - `ADMIN_EMAILS` allowlist
  - Google Cloud Console OAuth consent screen (support + developer email)
  - SETUP docs (when showing example values)
  - Any production-touching identity field
- **`ai@gravity.fast`** is a legacy Claude Code attribution string. It
  is NEVER the production admin, customer, support, or operations
  email. Anywhere it shows up in source / docs (other than this note),
  it's a bug — fix on sight.
- **Do NOT add a `Co-Authored-By: Claude …` trailer to commit
  messages.** Commits go in as Shubham only. (User asked 2026-05-27 —
  they don't want Claude credited as a co-author.) Same rule for PR
  bodies: no "🤖 Generated with Claude Code" footer.

---

## 15. DEV TOOLING AVAILABLE (set up 2026-06-11)

Three assistant tools are wired up for this project. Use them instead of
slower manual workarounds where they fit.

- **graphify** (knowledge-graph of the codebase). Installed via `uv`
  (`graphifyy` on PyPI); the `/graphify` skill is registered. Graph lives in
  `graphify-out/` (git-ignored — regenerated locally, ~1.3 MB).
  - Rebuild after big changes: `graphify update .` (code-only, no LLM, local).
  - Useful **without** an LLM key: `graphify-out/GRAPH_REPORT.md` (god nodes /
    most-connected abstractions, surprising connections, import cycles) and
    `graph.html` (interactive map). `graphify path "A" "B"`, `explain "X"`,
    `affected "X"` work on exact node names.
  - **Limitation:** natural-language `graphify query "..."` and community
    naming are weak in pure-local mode — they want a semantic LLM backend
    (`GEMINI_API_KEY` / `GOOGLE_API_KEY`, free tier fine). Not set yet.
- **Playwright MCP** (`playwright`, stdio). Browser automation for visual QA,
  screenshots, and E2E flows — primarily for the mobile-responsiveness pass
  (#90) and storefront checks. Points at the local dev server.
- **Supabase MCP** (`supabase`, hosted HTTP, `read_only=true`). **STAGED but
  inert until hosting:** the hosted MCP manages a *cloud* Supabase project, and
  there is no cloud project yet (local docker only until Phase 9). It needs a
  Personal Access Token + project_ref before it does anything. For live access
  to the *local* dev DB right now, use direct `psql` via the
  `supabase_db_advaita` docker container (or add a Postgres MCP pointed at
  `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

MCP servers are registered at **local** scope (`~/.claude.json`, not committed).
Keep the active set lean (≤5) to avoid context-token bloat.
