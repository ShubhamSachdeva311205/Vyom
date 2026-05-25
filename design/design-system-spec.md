# DESIGN SYSTEM SPECIFICATION

## CORE VISUAL PHILOSOPHY
The platform should feel like Raycast meets Superlist: calm, intelligent, premium
minimalism. Prioritize whitespace, typography hierarchy, and restraint above all.

---

## THE "TWO MODES" UX ARCHITECTURE
This application serves entirely different user contexts. Strictly separate the
design language based on the route. Never mix modes on the same page.

---

### MODE A — CINEMATIC PREMIUM (The Storefront)
**Routes:** `/`, `/store`, `/ibdp`, `/igcse`, `/community`, `/legal`

**Goal:** Sell the product, build trust, feel premium.

**Visual Rules:**
- **Dark mode first.** Use subtle radial/mesh CSS gradients at `opacity-30` or
  lower. Soft noise/grain overlays are permitted.
- **Light mode:** `#FAFAF9` base (not pure white). Gradients at `opacity-10`.
  Glassmorphism cards use `bg-white/70` with a subtle light border.
- **Surfaces:** Translucent cards with `backdrop-blur` and 1px semi-transparent
  borders.
- **Density:** Low. Content breathes. Generous whitespace.
- **Motion:** See Motion Tokens below — spring animations, stagger reveals,
  hover elevation.

---

### MODE B — OPERATIONAL CLARITY (The Command Center)
**Routes:** `/admin`, `/dashboard`, `/checkout`, secure PDF viewers

**Goal:** Maximum speed, legibility, and mobile usability for a non-technical
operator managing orders on a phone.

**Inspirations:** Stripe Dashboard, Shopify Admin.

**Visual Rules:**
- **Light mode only.** Background `#FFFFFF`. Sidebar/table alternates `#F9FAFB`.
  No dark mode toggle needed for admin.
- **Flat surfaces.** Clearly defined cards with standard borders (`border-border`).
  NO mesh gradients. NO backdrop-blur.
- **High density, organized.** Touch targets ≥ 44px. Clear focus rings. Always-
  visible labels on inputs — no placeholder-only forms.
- **Motion:** Zero Framer Motion. Instant feedback is prioritized. CSS hover
  only: `transition-colors duration-150 ease-in-out`.

---

## EXPLICIT MOTION TOKENS
Do not guess animation values. Use these exact parameters everywhere to keep
motion cohesive. Mode B uses none of these.

**Mode A — Spring (interactive elements):**
```
type: "spring", stiffness: 400, damping: 30
```

**Mode A — Hover (cards, buttons):**
```
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

**Mode A — Staggered list reveal:**
```
transition={{ staggerChildren: 0.1 }}
```

**Mode A — Hero / cinematic text reveal:**
```
transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
```

**Mode B — CSS only:**
```
transition-colors duration-150 ease-in-out
```

---

## TYPOGRAPHY SYSTEM
- **Primary font:** Geist (preferred) or Inter.
- **Mode A headings:** `letter-spacing: -0.02em` to `-0.04em` on `h1`–`h3`.
  Large, editorial, cinematic.
- **Monospace:** System mono (`font-mono`) for order IDs, coupon codes, and
  copy-to-clipboard values.
- **Hierarchy:**
  - Primary text: `text-foreground` (high contrast).
  - Secondary text: `text-muted-foreground` (muted gray).
  - Never use more than 3 type weights on a single page.

---

## SPACING & RADII
- **Base grid:** 4px system. Tailwind defaults: `space-1` = 4px, `space-4` = 16px.
- **Radii:**
  - Large cards: `rounded-2xl`
  - Primary action buttons: `rounded-full` (pill)
  - Admin inputs and table rows: `rounded-md`
- **Container widths:**
  - Mode A: `max-w-6xl` centered
  - Mode B forms: `max-w-lg`

---

## COLOR & STATUS TOKENS
Define in `globals.css` as CSS variables for both light and dark modes:

```css
--background
--foreground
--muted
--muted-foreground
--border
--ring
```

**Semantic status tokens (critical for admin panel):**

| State | Color | Use |
|---|---|---|
| Success | Green tint | Shipped orders, in-stock items |
| Pending | Blue tint | `pending_payment` orders, unmoderated submissions |
| Warning | Yellow/orange tint | Packed orders, inventory < 5 |
| Destructive | Red tint | New orders needing action, errors, out-of-stock |

Apply as Tailwind utility classes mapped to CSS variables, not hardcoded hex
values. This ensures tokens work in both modes.

---

## COMPONENT RULES
- **shadcn/ui as the base.** Extend primitives with `cva` variants — never fork
  the component source.
- **No hardcoded colors** inside component files. Always use CSS variable tokens.
- **Icon library:** Lucide React only. No mixing icon sets.
- **No inline styles** except for dynamic values (e.g., gradient positions
  driven by JS).
