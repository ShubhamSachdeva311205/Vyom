# Design System Spec — Mom's Business Platform

Defines typography, spacing, color tokens, and the **Two UX Modes**. All UI work must reference this document.

---

## Two UX Modes

### Mode A — Cinematic Premium

**Routes:** `/store`, `/ibdp`, `/igcse`, `/community` (and marketing landing pages).

| Attribute | Guidance |
|-----------|----------|
| Mood | Premium, editorial, confident |
| Motion | Framer Motion — subtle fades, parallax-lite, staggered reveals |
| Background | Mesh gradients, soft blur layers, depth |
| Typography | Large headings, tight tracking, generous whitespace |
| Density | Low — breathe; one primary CTA per viewport section |
| Color | Rich dark base with accent highlights |

### Mode B — Operational Clarity

**Routes:** `/admin`, `/dashboard` (customer library), secure PDF viewer shell.

| Attribute | Guidance |
|-----------|----------|
| Mood | Calm, legible, task-focused |
| Motion | Minimal — instant feedback only (no decorative animation) |
| Background | Flat, high-contrast surfaces |
| Typography | Smaller scale, normal tracking, clear hierarchy |
| Density | Higher — tables, kanban, forms optimized for mobile |
| Color | Neutral grays, semantic status colors (success/warning/error) |

**Rule:** Never mix Mode A motion/backgrounds inside Mode B shells.

---

## Typography

| Role | Font | Notes |
|------|------|-------|
| Primary | **Geist** or **Inter** (Geist preferred if bundled with Next) | Body, UI, admin |
| Headings (Mode A) | Same family | `letter-spacing: -0.02em` to `-0.04em` on `h1`–`h3` |
| Monospace | System mono | Order IDs, coupon codes, copy-to-clipboard blocks |

### Scale (rem, mobile-first)

| Token | Size | Line height | Use |
|-------|------|-------------|-----|
| `text-xs` | 0.75rem | 1rem | Labels, badges |
| `text-sm` | 0.875rem | 1.25rem | Secondary body, table cells |
| `text-base` | 1rem | 1.5rem | Body |
| `text-lg` | 1.125rem | 1.75rem | Lead paragraphs |
| `text-xl` | 1.25rem | 1.75rem | Section titles (Mode B) |
| `text-2xl` | 1.5rem | 2rem | Card titles |
| `text-3xl` | 1.875rem | 2.25rem | Page titles (Mode B) |
| `text-4xl`+ | 2.25rem+ | tight | Hero headings (Mode A only) |

---

## Spacing

Use a **4px base grid** mapped to Tailwind:

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight inline gaps |
| `space-2` | 8px | Icon gaps |
| `space-3` | 12px | Form field internal |
| `space-4` | 16px | Card padding (compact) |
| `space-6` | 24px | Card padding (default) |
| `space-8` | 32px | Section gaps (Mode B) |
| `space-12` | 48px | Section gaps (Mode A) |
| `space-16`+ | 64px+ | Hero vertical rhythm (Mode A) |

**Container max-widths**

- Mode A content: `max-w-6xl` centered
- Mode B admin: `max-w-7xl` for tables; forms `max-w-lg`–`max-w-xl`

---

## Radius & elevation

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 4px | Chips, badges |
| `rounded-md` | 8px | Inputs, buttons (Mode B) |
| `rounded-lg` | 12px | Cards |
| `rounded-xl` | 16px | Mode A cards, modals |
| `rounded-full` | — | Pills, avatars |

Shadows: Mode A may use soft `shadow-lg` with low opacity; Mode B uses borders (`border border-border`) over heavy shadows.

---

## Color tokens (CSS variables)

Implement in `globals.css` (dark default):

```css
:root {
  --background: /* near-black */;
  --foreground: /* off-white */;
  --muted: /* subdued surface */;
  --muted-foreground: /* secondary text */;
  --accent: /* brand highlight — warm gold or sage, TBD */;
  --accent-foreground: /* text on accent */;
  --border: /* subtle divider */;
  --destructive: /* errors, low stock */;
  --success: /* shipped, in stock */;
  --warning: /* packed, low inventory */;
}
```

Semantic usage:

- **Success** — Shipped orders, grant confirmed
- **Warning** — Packed, inventory &lt; 5
- **Destructive** — Errors, rejected submissions, out of stock

---

## Background system (Mode A)

1. **Base layer** — `var(--background)` solid
2. **Mesh layer** — 2–3 radial gradients at low opacity (accent hues)
3. **Blur layer** — optional `backdrop-blur` on nav/overlays only

Do not animate backgrounds in Mode B.

---

## Components (reference)

Built with shadcn/ui + CVA:

- **Button** — variants: `default`, `secondary`, `ghost`, `destructive`; sizes: `sm`, `md`, `lg`
- **Card** — Mode A: glass/blur optional; Mode B: flat bordered
- **Input** — always visible label in Mode B; placeholder-only discouraged in admin forms

Standard states required everywhere:

- `Skeleton` — loading
- `EmptyState` — illustration + one action
- `ErrorState` — message + retry

---

## Icons & status (admin)

| State | Emoji / color |
|-------|----------------|
| New order | 🟥 / destructive tint |
| Packed | 🟨 / warning tint |
| Shipped | 🟩 / success tint |

---

## Accessibility

- Minimum contrast WCAG AA on Mode B text
- Focus rings visible on all interactive elements
- Touch targets ≥ 44px on mobile admin views

---

## Legal shell (`/legal`)

- Mode B typography only (readable, no cinematic effects)
- "No Returns / Final Sale" and TOS must be above the fold on mobile
