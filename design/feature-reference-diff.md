# FULL_FEATURE_REFERENCE.md vs current build · 2026-05-26

A point-by-point comparison of `FULL_FEATURE_REFERENCE.md` (the ground-truth
spec) against what's been built (Phase 0–2) and what's in `roadmap.txt`.

Format: each row says where the diff is, which side wins, and what
action it implies. Final two sections list things added by us that
aren't in the FFR, and things to confirm before I act.

---

## A · Schema differences (would require migrations or new migrations)

| # | What | FFR says | What I built | Action needed |
|---|---|---|---|---|
| A1 | Table name for user profiles | `profiles` | `users` | Rename via migration OR keep `users` and update FFR. **Calling this out — FFR is canonical.** |
| A2 | Money fields | `price`, `compare_at_price` (regular numbers) | `price_paise` (integer in paise) | Keep paise internally (avoids floating point) but expose `price` (₹) at the API/UI layer. Add `compare_at_price_paise` column. **Schema add needed.** |
| A3 | Book format | No `format` enum. Books are always physical. `has_audio` + `has_answer_key` booleans capture what comes bundled. | `format` enum (physical/digital/bundle) | **Drop `format` enum, add booleans.** Significant migration. |
| A4 | Active flag | `is_active` (visible on storefront when true) | `published` | Rename `published` → `is_active`. Small migration. |
| A5 | R2 keys for audio/PDF | Implied — books with `has_audio=true` have associated R2 audio | `audio_r2_key`, `pdf_r2_key` columns | Keep, but make admin upload UI in Phase 5.3 fill them when `has_audio`/`has_answer_key` is toggled on. No schema change. |
| A6 | Discount eligibility | **Per-book `discount_eligible` boolean** — student10/teacher10 only apply when this is true | I put `applies_to_curriculum` and `applies_to_format` on the `coupons` table | **Major change.** Add `books.discount_eligible`. Drop coupon-side filters. Re-write redemption logic to read `discount_eligible` per line item. |
| A7 | Settings table | `settings (key text PK, value jsonb)` — used for `free_shipping_enabled` toggle | Doesn't exist | **New migration needed.** Seed with `{free_shipping_enabled: true}`. |
| A8 | Admin audit logs | `admin_audit_logs (admin_id, action, target_table, target_id, details jsonb, created_at)` | Doesn't exist | **New migration needed.** Wire into manual access grants, settings changes, coupon generation, etc. |
| A9 | Coupons table | `coupons (id, code, discount_percentage, type, is_used, used_at, used_by)` — flat single-table | I split into `coupons` + `coupon_redemptions` (audit trail) | Mine is stricter (proper audit trail + UNIQUE constraint on `(coupon_id, user_id)`). **Recommend keeping my version; update FFR to match.** |
| A10 | Order items | `price_at_purchase, final_price` (snapshots both pre- and post-coupon) | `unit_price_paise` only | Add `final_price_paise` for the post-coupon snapshot. Small migration. |

---

## B · Business rule differences

| # | What | FFR says | What I built / roadmap says | Action |
|---|---|---|---|---|
| B1 | Shipping — Bangalore rule | **REMOVED.** Free shipping based purely on Delhivery's quoted fee being `< ₹100`. | "Bangalore pincodes OR cart total < ₹100 = ₹0 shipping" (CLAUDE.md §7) | **Update CLAUDE.md §7 + roadmap.txt Phase 3.3.** Significant. |
| B2 | Shipping — admin override | Admin can globally toggle free shipping off (via `settings.free_shipping_enabled`) | Not mentioned | **Add to roadmap** Phase 5 + Phase 3.3. Depends on A7 (settings table). |
| B3 | Bundles / digital-only products | **Don't exist.** Audio + answer keys are FREE support material bundled with the physical book. | Implied in my `format` enum that bundles + digital products are sellable | **Drop bundles/digital-only from the model.** Big simplification. |
| B4 | Coupon eligibility per book | Books #5 and #7 (the listening/audio books) are explicitly NOT eligible for student10/teacher10 | All books equally eligible | Tied to A6 — add `discount_eligible` per book and enforce server-side. |
| B5 | Amazon orders | External link buttons on every book card; "no website discounts" copy beside | Not on placeholder pages | Build into the catalog UI when Phase 5.3 lands. |
| B6 | Rate limits | 3/IP/hour on community submit + feedback | Not specified at table level | Cloudflare rule (Phase 9 deployment) — keep on roadmap. |

---

## C · Pages / structure differences (rebuild work, not yet done since shells are placeholders)

| # | What | FFR | Current shell |
|---|---|---|---|
| C1 | `/ibdp` & `/igcse` | **Three tabs** — Answer Keys / Listening Audio / Order Books | Single "coming soon" shell |
| C2 | `/store` | Filter bar by curriculum + product cards + pincode shipping preview | Same coming-soon shell |
| C3 | `/store/[slug]` | Product detail page with full info, what's included, pincode calc, Amazon link | Doesn't exist |
| C4 | `/community` | Public feed of approved submissions with filter (poems/dramas/stories/other) | Twin-card Creative Corner + Feedback teaser |
| C5 | `/feedback` | **Separate URL** | Currently merged into /community |
| C6 | Forgot-password flow | Listed (A10) | Not built |
| C7 | `/dashboard/orders` (list + detail) | Yes, with status progression + Delhivery tracking link | Single /dashboard shell |
| C8 | `/dashboard/library` | Lists access grants grouped by book | Not built |
| C9 | `/dashboard/settings` | Update name, email, password | Not built |
| C10 | `/admin` overview cards | Today's orders, Revenue this week, Low stock, Pending submissions, Unread feedback | Generic admin shell with five panel cards |
| C11 | `/admin` quick actions | "Add New Book", "Generate Vendor Coupon", "Grant Access" buttons | Not built |
| C12 | `/admin/orders` Kanban | New/Packed/Shipped/Delivered/Cancelled tabs with one-click status buttons | Not built |
| C13 | `/admin/inventory` + Add Book drawer | Full form with all fields including `discount_eligible` toggle | Not built |
| C14 | `/admin/customers` search + detail | Search by email/name, see order history + grants | Not built |
| C15 | `/admin/coupons` | Read-only globals + vendor coupon generator (`VND-XXXX-XXXX` format) | Not built |
| C16 | `/admin/access-grants` | Manual grant form + revoke | Not built |
| C17 | `/admin/community` moderation queue | Approve/Reject tabs | Not built |
| C18 | `/admin/feedback` inbox | Mark as read toggle | Not built |
| C19 | `/admin/settings/audit` | Read-only audit log view | Not built |
| C20 | `/admin/settings/admins` | (FROM USER REQUEST) Add/remove admin emails — Issue #10 | Not built |
| C21 | CSV exports | "Download Today's Orders (CSV)" + single-order CSV | Not built |
| C22 | "Copy Billing Details" for Vyapar | Pre-formats billing block as plain text | In roadmap Phase 6 |

C1–C19 are all **Phase 5** (admin) and **Phase 1.3-replacement** (storefront real pages) work — the shells we built are placeholders, the FFR is the spec for what fills them.

---

## D · Things in current build/roadmap NOT in FFR

| # | What | In repo? | In FFR? | Suggested action |
|---|---|---|---|---|
| D1 | Mascot system (student/teacher/bookworm/star with coupon Easter egg) | Built | Not mentioned | Brand layer we added. Keep — it's part of the brand voice now. Document in FFR if you want it to survive future spec rewrites. |
| D2 | Ambient brand decoration (floating books + scattered companions) — Issue #2 | Roadmap Phase 8.5 | Not mentioned | Same as D1. |
| D3 | KineticHeading animation | Built | Not mentioned | Same as D1. |
| D4 | GST / tax handling at checkout | Roadmap Phase 3.5 | Not mentioned | **Confirm:** are books exempt (printed books have 0% GST in India)? If so, drop from roadmap. If not, keep. |
| D5 | Disposable email blocklist | Built (Phase 2.4) | Not mentioned | Keep — it's an implementation detail of "secure auth", not a customer feature. |
| D6 | Theme toggle (light/dark) | Built | FFR says Mode A is dark-first, Mode B is light. Toggle implied to exist on storefront. | Aligned. |
| D7 | `/contact` page | Roadmap Phase 1.4 | FFR has contact via email but no separate page | Could fold into `/legal` or keep as small page. Confirm. |

---

## E · Catalog data — needs seeding

The FFR §G lists 7 real books. None of these are seeded into the DB yet.
This needs to land before/during Phase 5.3 (admin product CRUD) — could
also be a one-time seed migration.

| # | Title (abbrev) | ISBN | Price | Discount? | Audio? | Answer key? |
|---|---|---|---|---|---|---|
| 1 | IBDP Hindi B HL — Reading | 9789348898029 | ₹1,950 | Yes | No | Yes |
| 2 | IBDP Hindi B SL — Reading | 9789348898470 | ₹1,950 | Yes | No | Yes |
| 3 | IBDP Hindi B-SL-IO | 978-93-48898-15-9 | ₹1,050 | Yes | No | No |
| 4 | IBDP Hindi B-HL-IO | 978-93-48898-32-6 | ₹1,050 | Yes | No | No |
| 5 | IBDP Shravan Lekhan (Listening) | 978-93-5810-024-2 | ₹1,950 | **No** | Yes | No |
| 6 | IGCSE Hindi Paper 1 — Reading/Writing | 978-93-5782-125-4 | ₹1,950 | Yes | No | Yes |
| 7 | IGCSE Hindi Paper 2 — Listening | 978-93-5813-838-2 | ₹1,999 | **No** | Yes | No |

---

## F · Open decisions for you

These are the architectural calls I need before I touch migrations again.
None are blocking — current build still runs — but they shape Phase 3+.

1. **Rename `users` → `profiles`?** FFR uses `profiles`; I used `users`. Either is fine but you should pick one and the other side updates. Renaming `users` later is a non-trivial migration (foreign keys + auth trigger).
2. **Drop `books.format` enum?** FFR has no bundles/digital-only — books are always physical with `has_audio`/`has_answer_key` flags. Means dropping the enum + columns + adding two booleans + dropping `cart_items.format` snapshot. Big migration but big simplification.
3. **Add `books.discount_eligible`?** FFR makes coupons per-book-eligible (Books #5 and #7 are excluded from student10/teacher10). Currently I have coupon-side filters which don't support this. Yes-or-no.
4. **Bangalore-pincode free-shipping rule — drop?** FFR explicitly removes it in favor of "Delhivery-quote-under-₹100" + admin toggle. Yes-or-no.
5. **`settings` and `admin_audit_logs` tables — add now?** Both new migrations. The `admin_emails` table from Issue #10 fits the same pattern. Recommend adding all three in one Phase 2.7 migration before Phase 3 starts.
6. **GST handling — keep or drop?** FFR doesn't mention tax. Printed books in India are typically GST-exempt. If your books are all 0% GST, drop the column + Phase 3.5 subphase.
7. **Catalog seeding — separate migration or admin upload?** Seven books are known. Either seed via migration (faster) or wait for Phase 5.3 admin upload UI and add via that (more realistic test).
8. **`/contact` page — keep as separate route or fold into `/legal`?** FFR doesn't have it but has contact info inline.
9. **`/community` vs `/feedback` URL split** — currently merged on `/community`. Split per FFR?

---

## G · Strong recommendation

Phase 3 work hits the schema (cart, orders, checkout, coupons all touch the books table). **Decide F1–F4 before Phase 3 starts** — otherwise we'll write Phase 3 against the wrong schema and have to refactor.

F5 (new tables) can wait until Phase 5 or land as a Phase 2.7 migration now.
F6–F9 are smaller and can be decided as we go.
