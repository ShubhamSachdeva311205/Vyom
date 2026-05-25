# CLAUDE.md — Mom's Business Platform

AI and developer instructions for this codebase. Follow these rules on every change.

## Project overview

E-commerce and digital content platform for educational books (physical + digital), with an admin panel for order fulfillment, inventory, coupons, and community moderation. Stack: **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Supabase** (auth + DB), **Razorpay**, **Cloudflare R2**, **Resend**, deployed on **Vercel** with **Cloudflare** DNS and rate limiting.

## Core principles

1. **Operational clarity for admin** — Mom's panel (`/admin`, `/dashboard`) must be high legibility, mobile-friendly, and fast. No decorative motion in operational UIs.
2. **Cinematic premium for storefront** — Public marketing and store routes (`/store`, `/ibdp`, `/igcse`, `/community`) use Mode A (see `design-system-spec.md`).
3. **Zero exposure of assets** — Never send signed R2 URLs to the browser. Stream audio/PDF through Next.js API routes; render PDFs via pdf.js on canvas with server-side watermarking.
4. **Security by default** — RLS on all Supabase tables; HMAC verification on Razorpay webhooks; rate limits on checkout, login, and coupon routes.

## Database changes (strict)

- **Only use Supabase Migrations** for schema changes. Do not edit tables manually in the Supabase dashboard without a matching migration file in the repo.
- Name migrations descriptively: `YYYYMMDDHHMMSS_description.sql`.
- Every new table must include RLS policies in the same migration (or a follow-up migration in the same PR).
- Use atomic transactions for coupon redemption and inventory decrements to prevent race conditions.

## Code standards

### TypeScript

- Strict mode; no `any` unless documented with a one-line reason.
- Prefer explicit types for API payloads, Supabase rows, and webhook bodies.
- Colocate types with features (`src/types/`, or next to the feature module).

### Next.js

- **App Router only** — no Pages Router.
- Server Components by default; add `"use client"` only when needed (hooks, browser APIs, Framer Motion).
- API routes and Route Handlers live under `src/app/api/`.
- Secrets only in server env (`process.env`); never expose service keys in client bundles.

### Components

- Use **shadcn/ui** patterns with **CVA** for variants (buttons, cards, inputs).
- Shared primitives in `src/components/ui/`; feature components in `src/components/<feature>/`.
- Every list/table view needs **loading (skeleton)**, **empty**, and **error** states.
- Match naming and file structure of existing components before adding new ones.

### Styling

- Tailwind + CSS variables for design tokens (see `design-system-spec.md`).
- Dark-mode-first via `next-themes`.
- Do not hardcode hex colors in components; use token classes.

### File organization

```
src/
  app/           # routes, layouts, API handlers
  components/    # ui + feature components
  lib/           # clients (supabase, razorpay), utilities
  types/         # shared TypeScript types
```

## Domain rules (business logic)

| Area | Rule |
|------|------|
| Discounts | Global codes `student10`, `teacher10` = 10% off site goods; Amazon purchases exempt |
| Shipping | Bangalore pincode OR cart &lt; ₹100 → ₹0 shipping; else Delhivery estimate |
| Digital access | `access_grants` UNIQUE on `(user_id, book_id)` |
| Coupons | Single-use codes must use DB-level locking / atomic update |
| Community | Guest submissions allowed (no `user_id` required) |
| Legal | `/legal` — no returns / final sale policy must remain prominent |

## Payments

- Create Razorpay orders server-side only.
- Verify `payment.captured` webhooks with HMAC before updating orders or granting access.
- Never trust client-side payment success alone.

## Admin panel

- Kanban order states: New → Packed → Shipped (tracking URL on ship).
- Inventory warnings when `inventory_count < 5`.
- Customer lookup by email: orders, shipping, digital grants.
- Vyapar: "Copy Billing Details" formatted text block on order view.

## Testing & commits

- Run `pnpm lint` and `pnpm build` before marking work complete.
- One logical change per commit; message format: `phase-N: short description`.
- Update `roadmap.txt` checkboxes when a roadmap item is done.

## What not to do

- Do not add alternative DB clients or ORMs alongside Supabase for app data.
- Do not expose raw PDF/audio URLs to the client.
- Do not skip RLS "temporarily."
- Do not commit `.env.local` or secrets.
- Do not over-abstract one-off UI; keep admin tools simple and readable.
