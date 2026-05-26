# FULL FEATURE REFERENCE — Advaita Platform
## Purpose
This document is a complete reference of every feature on the platform.
It is NOT an implementation order. Use it alongside the roadmap and CLAUDE.md
to ensure nothing is missed when building any surface.

Read alongside:
- `.claude/CLAUDE.md` — architecture and coding rules
- `design/design-system-spec.md` — visual system and Two UX Modes
- `roadmap.txt` — phased execution order

---

# SECTION G — PRODUCT CATALOGUE (Ground Truth)

This is the complete current catalogue. Use this data when seeding the database,
building product cards, or rendering any book listing. Do not invent titles or ISBNs.

Contact: shubhamhelpseries@gmail.com | Mobile: ***REDACTED***
Publisher note: Books 1–4 published by Gyaanmudra. Books 5–7 self-published by Seema Sachdeva.
Sold by: Author / Seema Sachdeva for all titles.

## IBDP Books

| # | Title | ISBN | Price | Discount Eligible | Has Audio | Has Answer Key |
|---|---|---|---|---|---|---|
| 1 | Shubham IBDP Hindi B HL — पठन – उच्च स्तर | 9789348898029 | ₹1,950 | Yes (student10 / teacher10) | No | Yes |
| 2 | Shubham IBDP Hindi B SL — पठन – मानक स्तर | 9789348898470 | ₹1,950 | Yes (student10 / teacher10) | No | Yes |
| 3 | Shubham IBDP Hindi B-SL-IO (Moukhik pareeksha par aadharit) — मानक स्तर | 978-93-48898-15-9 | ₹1,050 | Yes (student10 / teacher10) | No | No |
| 4 | Shubham IBDP Hindi B-HL-IO (Moukhik pareeksha par aadharit) — उच्च स्तर | 978-93-48898-32-6 | ₹1,050 | Yes (student10 / teacher10) | No | No |
| 5 | Shubham IBDP Hindi B HL and SL — SHRAVAN LEKHAN (Listening) मानक तथा उच्च स्तर | 978-93-5810-024-2 | ₹1,950 | No (NA) | Yes | No |

## IGCSE Books

| # | Title | ISBN | Price | Discount Eligible | Has Audio | Has Answer Key |
|---|---|---|---|---|---|---|
| 6 | Shubham IGCSE Hindi as a Second Language Paper 1 — Reading and Writing (New curriculum) | 978-93-5782-125-4 | ₹1,950 | Yes (student10 / teacher10) | No | Yes |
| 7 | Shubham IGCSE Hindi as a Second Language Paper 2 — Listening Component (New curriculum) | 978-93-5813-838-2 | ₹1,999 | No (NA) | Yes | No |

## Important catalogue rules
- Answer keys and audio are FREE support material bundled with the physical book.
  They are NOT sold separately. There are NO digital-only or bundle products.
- Access to answer keys and audio is granted when the physical book is purchased
  (via website order webhook) or manually granted by admin (for Amazon/offline buyers).
- Books marked "Discount Eligible: No" means the teacher10/student10 codes do NOT apply.
  This must be enforced in coupon validation logic — check the book's discount_eligible
  flag before applying any percentage discount.
- All books are currently in stock.

---

# SECTION A — PUBLIC STOREFRONT (Mode A: Cinematic Premium)

## A1. Global Navigation
- Logo + platform name ("Advaita") top-left
- Nav links: IBDP | IGCSE | Store | Community | Feedback
- Auth state: "Sign In" button when logged out; avatar/dropdown when logged in
- Mobile: hamburger menu with full-screen drawer (use `vaul`)
- Active route highlighted
- Sticky on scroll with subtle background blur (Mode A only)

## A2. Landing / Home Page (`/`)
- Hero section: large editorial headline, subheadline, CTA buttons
  ("Browse Books" → `/store`, "Sign In" → auth)
- Brief value proposition section (what the platform offers)
- Product highlights: 2–3 featured book cards
- Trust signals: brief "About" blurb about the author/teacher (Seema Sachdeva)
- Shipping info callout: "Free shipping when Delhivery charges are under ₹100"
- Footer link to `/legal` (policies)

## A3. IBDP Section (`/ibdp`)
Three sub-tabs (answer keys + audio are support material, not purchasable separately):

### A3a. Answer Keys
- Hindi B HL answer key — access-gated (must own physical book)
- Hindi B SL answer key — access-gated (must own physical book)
- IO books (SL-IO, HL-IO) do not have answer keys — do not show this tab for them
- If user has access: render secure PDF viewer (canvas mode)
- If no access: locked card — "Purchase the physical book to unlock"
- No standalone purchase option — access comes only with book ownership

### A3b. Listening Audio
- IBDP Shravan Lekhan book (Book #5) includes audio support
- Visible ONLY to verified purchasers of that specific physical book
- Custom audio player — no native `<audio>` src exposed
- Audio streamed via `/api/stream-audio` — R2 URL never reaches browser
- Locked state for non-purchasers: "Purchase the Shravan Lekhan book to unlock"

### A3c. Order Books
- Cards for all 5 IBDP books from the catalogue above
- Each card: cover image, title (Hindi + English), ISBN, price,
  discount eligibility badge, inventory status, publisher
- "Order Directly" button → checkout with discount eligibility enforced
- "Order on Amazon" button → external Amazon link (new tab)
- Callout: "Amazon orders do not qualify for discount codes"
- Coupon input (direct orders only): student10 / teacher10 / vendor code
  — coupon validation checks book's discount_eligible flag before applying
- Shipping: auto-calculated at checkout (see shipping rules in A6)
- No returns notice → link to `/legal`

## A4. IGCSE Section (`/igcse`)
Same three-tab structure:

### A4a. Answer Keys
- IGCSE Paper 1 answer key — access-gated (must own physical book)
- Paper 2 (Listening) has no answer key — do not show for it

### A4b. Listening Audio
- IGCSE Paper 2 Listening book (Book #7) includes audio
- Same streaming protection as IBDP audio
- Access-gated to purchasers of Book #7 only

### A4c. Order Books
- Cards for both IGCSE books (Books #6 and #7)
- Same order/coupon/shipping flow as IBDP

## A5. Store (`/store`)
- Unified listing of all 7 books
- Filter bar: by curriculum (IBDP / IGCSE)
- Each product card: cover image, title, curriculum tag, price,
  discount eligibility badge, inventory badge, "Order" CTA
- Product detail page (`/store/[slug]`):
  - Full title (Hindi + English), ISBN, publisher, price
  - What comes with the book: check/cross icons for Audio, Answer Key
  - Coupon input with discount eligibility note if not eligible
  - Pincode input → shipping cost display
  - "Order on Amazon" alternate CTA with discount disclaimer
  - No returns notice

## A6. Checkout (`/checkout`) — Mode B
- Cart summary (line items, quantities, prices)
- Coupon code input — validated server-side only:
  - Check book's `discount_eligible` flag before applying
  - student10 / teacher10: 10% off eligible books only
  - Vendor codes: single-use, any percentage, eligible books only
- Pincode input → shipping cost display:

  ### Shipping rules (IMPORTANT — read carefully)
  - Free shipping condition: Delhivery's calculated shipping fee for the order
    is under ₹100 — NOT the order value. If Delhivery quotes ₹80 shipping,
    it's free. If Delhivery quotes ₹150, customer pays ₹150.
  - Free shipping override toggle: admin can DISABLE free shipping site-wide
    from the admin panel (see C4b). When disabled, customer always pays the
    Delhivery rate regardless of the fee amount.
  - Use case for disabling: during promotions/sales where shipping subsidy
    would erode margins, or for large-quantity orders.
  - Bangalore pincode free shipping rule is REMOVED. Shipping is purely
    based on Delhivery's quoted fee vs the ₹100 threshold.

- Order total breakdown: subtotal, discount, shipping, final total
- Razorpay payment button (order created server-side before rendering)
- On success: redirect to `/dashboard/orders/[id]` with confirmation
- Guest checkout NOT supported — must be signed in
- No abandoned cart recovery at launch

## A7. Community — Creative Corner (`/community`)
- Public feed of approved submissions: poems, dramas, stories
- Filter by type: All | Poems | Dramas | Stories | Other
- Each card: title, author name, type badge, excerpt, "Read" expand/modal
- Submission form (no login required):
  - Author name (required)
  - Author email (required, not displayed publicly)
  - Title (required)
  - Type selector: Poem / Drama / Story / Other
  - Body textarea (plain text only, HTML-escaped on save)
  - Submit → `content_submissions` row with `approval_status = pending`
  - Success: "Thank you! Your submission is under review."
- Only approved submissions appear publicly
- Rate limit: max 3 per IP per hour (Cloudflare rule)

## A8. Feedback (`/feedback`)
- Author name, author email (optional), message, submit
- No login required
- Stored in `feedback` table, visible in admin inbox
- Rate limit: max 3 per IP per hour

## A9. Legal (`/legal`)
- No returns / no refunds — all sales final
- All disputes via email: shubhamhelpseries@gmail.com
- Amazon orders: no website discounts; Amazon's own return policy applies
- Shipping policy: shipping cost shown at checkout; free when Delhivery
  quotes under ₹100 (subject to admin override during promotions)
- Support material (audio, answer keys): provided free with physical book;
  access is non-transferable; view-only, no downloads
- Privacy: name, email, address used only for order fulfilment
- Copyright: all content © Seema Sachdeva / Shubham Help Series

## A10. Auth Pages
- Sign in: email/password + Google OAuth
- Sign up: name, email, password
- Magic link: for offline/Amazon buyers granted manual admin access
- Forgot password flow

---

# SECTION B — CUSTOMER DASHBOARD (Mode B: Operational Clarity)

## B1. Dashboard Home (`/dashboard`)
- Welcome with user's name
- Quick links: My Orders | My Library | Account Settings

## B2. My Orders (`/dashboard/orders`)
- All orders, most recent first
- Each row: order ID (monospace), date, items, total, status badge
- Click → Order Detail:
  - Line items, quantities, prices
  - Coupon applied
  - Shipping cost
  - Delhivery tracking link (shows when status = shipped)
  - Status progress indicator
  - "Contact us" link for disputes (no returns CTA)

## B3. My Library (`/dashboard/library`)
- All digital access grants
- Grouped by book
- Each item: book title, type badge (Audio / Answer Key), "Open" button
- Empty state: "No content yet. Purchase a book to unlock access."

## B4. Account Settings (`/dashboard/settings`)
- Update display name
- Update email (requires re-auth)
- Change password
- Read-only: joined date, total orders

---

# SECTION C — ADMIN COMMAND CENTER (`/admin`) — Mode B: Operational Clarity

All admin routes locked behind `profiles.role = 'admin'` RLS.
Mobile-first. Large touch targets (≥44px). Zero animations. Flat surfaces.
Desktop: sidebar nav. Mobile: bottom tab bar or hamburger.

## C1. Admin Navigation
- Dashboard | Orders | Inventory | Settings | Customers | Coupons |
  Access Grants | Community | Feedback

## C2. Admin Dashboard Overview (`/admin`)
- Summary cards: Today's orders, Revenue this week, Low stock alerts,
  Pending community submissions, Unread feedback
- Quick actions: "Add New Book", "Generate Vendor Coupon", "Grant Access"
- Recent orders list (last 5)

## C3. Order Management (`/admin/orders`)

### C3a. Orders List
- Tabs: All | New 🟥 | Packed 🟨 | Shipped 🟩 | Delivered | Cancelled
- Each row: order ID, customer name, items summary, total, timestamp, status
- One-click status buttons:
  - New → "Mark as Packed"
  - Packed → "Mark as Shipped" (opens modal requiring Delhivery tracking URL)
  - Shipped → "Mark as Delivered"
- "Mark as Shipped" modal: tracking URL field (required) → confirm →
  updates status + fires Resend shipping email to customer
- Soft cancel button (never deletes)

### C3b. Order Detail (`/admin/orders/[id]`)
- Customer info, shipping address, line items, coupon used, shipping cost, total
- Status history log
- "Copy Billing Details" button → formats to plain text for Vyapar paste
- "Download CSV" (single order)

### C3c. Exports
- "Download Today's Orders (CSV)" on orders list
- Fields: order ID, customer name, address, pincode, items, total, coupon
- Admin-only

## C4. Inventory Management (`/admin/inventory`)

### C4a. Book List & Stock
- All books with inventory_count
- Each row: thumbnail, title, curriculum, price, stock, status badge
- Inline stock edit: click count → type → save (atomic)
- "Add New Book" → drawer with full form:
  - Title (required, Hindi + English if applicable)
  - ISBN
  - Slug (auto-generated, editable)
  - Curriculum: IBDP / IGCSE
  - Publisher (Gyaanmudra / Self)
  - Price (required)
  - Compare-at price (optional, for strikethrough)
  - Inventory count (required)
  - Cover image upload → R2, saves URL
  - Has Audio toggle
  - Has Answer Key toggle
  - Discount Eligible toggle (controls whether student10/teacher10 apply)
  - Is Active toggle (inactive = hidden from storefront)
  - Description textarea
- "Edit Book" on each row → same drawer pre-filled
- No permanent delete — deactivate via Is Active only
- Low stock Resend alert fires when count drops below 5

### C4b. Shipping Settings
- "Free Shipping Toggle" — global on/off switch
- When ON: orders where Delhivery quotes < ₹100 ship free
- When OFF: customer always pays full Delhivery rate (no free shipping)
- Current state displayed clearly: "Free shipping: ENABLED / DISABLED"
- Stored in a `settings` table (key: `free_shipping_enabled`, value: boolean)
- Use case: disable during sales/promotions to protect margins
- Change is logged to `admin_audit_logs`

## C5. Customer Management (`/admin/customers`)
- Search by email or name
- List: name, email, total orders, joined date
- Customer detail:
  - Order history with status
  - All access grants (book → type)
  - "Resend Access Email" button
  - "Books Purchased" list

## C6. Coupon Management (`/admin/coupons`)

### C6a. Global Coupons (read-only display)
- student10: 10% off eligible books, multi-use, always active
- teacher10: 10% off eligible books, multi-use, always active
- Usage stats: total redemptions

### C6b. Vendor Coupon Generator
- Input: discount % (1–100)
- "Generate Code" → creates `VND-XXXX-XXXX` format code
  - Inserted into `coupons` table: `type = single_use`, `is_used = false`
  - Atomic DB lock on redemption
- Code list: code (monospace), discount %, created date,
  Active 🟢 / Used 🔴 (with used_at + used_by email)
- "Copy Code" on active rows
- No delete — permanent audit record

## C7. Access Grant Management (`/admin/access-grants`)

### C7a. Manual Grant Form
- Email (required)
- Book selector (all active books)
- Access type: Audio | Answer Key
- "Grant Access" button:
  - Creates `access_grants` row
  - Looks up user_id by email (creates profile stub if new)
  - Fires Resend magic link email
  - Logs to `admin_audit_logs`: `action = 'manual_grant'`
  - Toast: "Access granted and email sent to [email]"

### C7b. Grant List
- All grants, searchable by email or book
- Columns: email, book, type, granted date, granted by (admin / auto)
- "Revoke" → sets `is_active = false` (never deletes)

## C8. Community Moderation (`/admin/community`)
- Tabs: Pending | Approved | Rejected
- Each card: author, type, title, body preview, date
- Approve ✅ / Reject ❌ / View Full
- Pending badge on nav item
- No edit — accept or reject only

## C9. Feedback Inbox (`/admin/feedback`)
- All feedback, newest first
- Each row: name, email, preview, date, status (new/read)
- Click to expand full message
- "Mark as Read" toggle
- No in-app reply

## C10. Audit Log (`/admin/settings/audit`)
- All `admin_audit_logs` entries
- Columns: timestamp, admin name, action, target, details (expandable JSON)
- Filterable by action type
- Read-only

---

# SECTION D — TRANSACTIONAL EMAILS (Resend)

| Trigger | Recipient | Content |
|---|---|---|
| Payment captured | Customer | Confirmation, line items, total, order ID |
| Order marked Shipped | Customer | Shipping notification + Delhivery tracking link |
| Manual access grant | Customer | Magic link + what content is now accessible |
| Inventory < 5 | Admin | Low stock alert: book name + current count |
| New order placed | Admin | Brief notification (optional) |

---

# SECTION E — SECURITY RULES

- Audio: stream via `/api/stream-audio?id=...` — R2 URL never sent to browser
- PDFs: buffer via API route, watermark server-side (email + order ID),
  render with `pdf.js` as `<canvas>` — no `<embed>` or `<iframe>`
- Coupons: atomic transaction; `is_used`, `used_at`, `used_by` set together
- Razorpay: HMAC webhook verification before any DB write
- RLS: all tables; admin enforced at DB level via `profiles.role`
- Rate limits (Cloudflare): login, checkout, coupon, feedback, community submit
- Discount eligibility: enforced server-side against `books.discount_eligible`
- Free shipping toggle: read server-side at checkout, never trusted from client

---

# SECTION F — COMPLETE TABLE REFERENCE

| Table | Key columns |
|---|---|
| `profiles` | id, email, full_name, role (customer/admin) |
| `books` | id, slug, title, isbn, curriculum, publisher, price, compare_at_price, inventory_count, has_audio, has_answer_key, discount_eligible, cover_image_url, is_active |
| `orders` | id, user_id, status, total_amount, shipping_cost, coupon_code, razorpay_order_id, razorpay_payment_id, shipping_address, tracking_url |
| `order_items` | id, order_id, book_id, quantity, price_at_purchase, final_price |
| `access_grants` | id, user_id, book_id, type (audio/answer_key), granted_at, is_active |
| `coupons` | id, code, discount_percentage, type (global/single_use), is_used, used_at, used_by |
| `content_submissions` | id, author_name, author_email, title, submission_type (poem/drama/story/other), body, approval_status |
| `feedback` | id, author_name, author_email, message, status (new/read) |
| `admin_audit_logs` | id, admin_id, action, target_table, target_id, details (jsonb), created_at |
| `settings` | id, key (text, unique), value (jsonb), updated_by, updated_at |

Note: `settings` table is new. Stores platform-level toggles.
Seed with: `{ key: 'free_shipping_enabled', value: true }` on first migration.

---

# SECTION H — BRAND VOICE (added 2026-05-26)

Companion to `design/design-system-spec.md` Two-UX-Modes spec. Captures
the brand-decoration layer specific to Advaita's storefront. Not pure
features — these are atmospheric choices that make the site feel like
a place, not a tool. Inspired by Mindspace, Zen browser, Superlist,
matvoyce.tv, nothing.tech.

## H1. Mascot cast

Four hand-authored SVG companions live in `src/components/ui/mascot.tsx`.
Soft distorted blobs with closed-eye sleeping faces by default;
hover-to-wake reveals open eyes + a wider grin.

| Name | Silhouette | Accessory | Default coupon |
|---|---|---|---|
| `student` | Round irregular | White V-collar (shirt) | `student10` |
| `teacher` | Slightly oval, larger | Rounded rectangle glasses | `teacher10` |
| `bookworm` | Tall capsule | Over-ear headphones, brand-color LED | — |
| `star` | Wide pebble, +6° tilt | — | — |

### Mascot props
- `name` — which character.
- `mood` — `happy` (default) or `sad`. Sad keeps the smile flipped to a
  frown and tints the accessory accent (e.g. headphone LED) red. Used
  on the 404 page.
- `code` — overrides the default coupon code on the floating chip.
- `hideCoupon` — suppresses the chip even if a default exists.
- `size` — xs (36px) for navbar, sm / md / lg for content surfaces.

### Coupon-chip Easter egg
Only `student` and `teacher` show a coupon chip on hover. Click the
chip to copy the code to clipboard with a toast confirmation. The
copy uses navigator.clipboard with an execCommand fallback so it works
in older browsers + insecure contexts.

## H2. Ambient brand decoration (Issue #2 · Phase 8.5)

Site-wide decoration that makes pages feel populated without adding
noise:

- **Floating books** — 3–5 stylised book-spine SVGs drift behind hero
  sections on `/`, `/store`, `/ibdp`, `/igcse`. Subtle parallax on
  scroll + gentle bob via CSS keyframes. Respects
  `prefers-reduced-motion`.
- **Scattered companions** — small Mascot instances peek from
  unexpected corners across storefront pages. Distribution rule: 1–2
  per page, NEVER on operational routes (admin / dashboard /
  checkout / design-tokens). Only `student` and `teacher` carry
  coupons; the rest are silent.
- **NoiseLayer** — fixed-position film-grain SVG mounted once at the
  storefront layout root. Soft-light blend mode at theme-driven
  opacity (~12% dark, ~5% light, 0% on operational routes).

## H3. Kinetic typography

`<KineticHeading>` (in `src/components/ui/kinetic-heading.tsx`) splits
a heading into words and reveals them with a staggered slide-up +
fade. One word can be highlighted in `--brand` colour via the
`emphasize` index. Respects `prefers-reduced-motion`. Used on the
homepage hero (`Study, slowly.`).

## H4. Theme toggle

- Storefront defaults to **dark mode** (`next-themes` defaultTheme).
- Theme toggle (Sun/Moon) lives in the navbar — toggles between
  `light` and `dark`. No "system" option; the user is making a
  deliberate choice when they hit the toggle.
- Operational routes are forced **light only** via
  `data-mode="operational"` on the wrapping layout. The toggle is
  hidden there.

## H5. Status colour semantics

Used for order pills, inventory badges, system feedback. Each has a
bright variant for surfaces and a tinted-background pair for
secondary use.

| Token | Maps to (Mode A dark) | Used for |
|---|---|---|
| `--success` | emerald | shipped orders, in-stock |
| `--warning` | amber | packed orders, inventory < 5 |
| `--pending` | sky | pending_payment, unmoderated |
| `--destructive` | rose | new orders needing action, errors, out-of-stock |
| `--brand` | emerald (locked palette) | primary CTA, focus ring, mascot accent |

Status text colour uses the bright variant against a faded
status-tinted background — see `src/components/ui/badge.tsx`.

## H6. Sound discipline

No audio outside of:
- Audio companion playback (Phase 4, in the player UI).
- Toast notifications use Sonner's default behaviour — silent.

No autoplay video. No background music. No UI sound effects.
