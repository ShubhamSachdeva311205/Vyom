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
