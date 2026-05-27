# Prompt for the next Claude Code session

Paste everything below this line into the fresh `/clear`'d session as
your first message. The handoff is short — `HANDOFF.md` is now 163
lines, deliberately lean. The roadmap, journal, FFR, CLAUDE.md, and
memory files cover everything else.

---

You're continuing work on **Advaita** — an e-commerce platform for
IBDP + IGCSE Hindi study books that Shubham is building for his mom
Seema (the author / sole seller). The previous session ran out of
context. **First action: read `HANDOFF.md` end-to-end.** It's only
163 lines now and intentionally non-redundant — it points you to
where everything else lives.

Then read these in order:

1. `.claude/CLAUDE.md` — architecture rules. §1 (clarification gate),
   §13 (GitHub Issues workflow), §14 (commit attribution — **no
   `Co-Authored-By: Claude` trailer**, ever).
2. `memory/` (via the loaded `MEMORY.md` index — should already be in
   context). Three feedback rules: verify before closing, no
   Co-Authored-By, roadmap+journal tick per commit.
3. The last ~100 lines of `BUILD-JOURNAL.md` — the most recent "Next
   up" list at the bottom tells you what's queued.
4. `FULL_FEATURE_REFERENCE.md` only when you need the product spec
   for a feature you're touching.

Then orient on open work:

- `git log --oneline -15`
- `gh issue list --state open`

## Where things stand at the start of your session

Shipped end-to-end:
- Phase 1.x — design tokens, UI primitives, page shells, storefront hero, mascots, brand polish
- Phase 2 — Supabase schema (14 tables, RLS), customer + admin auth, middleware (Google OAuth deferred to Phase 7 via Issue #7)
- Phase 3.1 — Razorpay checkout (order create, HMAC webhook, student10/teacher10 + multi-use, post-payment redemption, Amazon coupon notice)
- Phase 3.2 — cart server actions, /cart page, navbar count badge, anon→user cart merge on sign-in, /order/[id]/success with print-to-PDF

Queued open work — the "Next up" list at the bottom of `BUILD-JOURNAL.md`:
1. **Phase 3.3 — Shiprocket shipping integration** (Issue #81). Blocked on the user pasting `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` into `.env.local`. Ask them about it at session start; if they don't have credentials yet, pick another item.
2. **Phase 3.6 — Vyapar-style Tax Invoice PDF generation** (Issue #83). Reference layout is `Sale_18_08-05-2026.pdf` in the repo root — extract via `pdftotext -layout` to see the structure. Replaces the current PrintReceiptButton (#77 interim).
3. **Phase 5.1 — Admin orders + inventory UI**. Real orders are landing in the DB via the working checkout, but Mom has no UI to see/manage them yet. High priority. Issue #61.
4. **Phase 5.5 — Admin allowlist UI** (Issue #10). Gets Mom off the env-var dance.
5. **Phase 8.7 — Security P0s** (Issues #74, #75 — admin gate drift, first-admin takeover). Must close before any production launch.

Open user-blocking items to surface at session start:
- **#81** — Shiprocket dashboard email/password.
- **#7** — Google OAuth still fails end-to-end. Deferred to Phase 7.

## Workflow rules — non-negotiable

1. **File a GitHub Issue** for every user-reported bug or feature
   request. Templates in `.github/ISSUE_TEMPLATE/`. Use the bug or
   feature template; never `--body-file -` without one.
2. **Read before Edit.** `Edit()` silently fails if the file wasn't
   `Read()` first in this session. After any non-trivial edit, grep
   for the new content to confirm it landed.
3. **`Refs #N`, not `Closes #N`.** Per
   `memory/feedback_verify_before_closing.md`, don't auto-close
   issues via commit keywords. Wait for the user's visual sign-off,
   then `gh issue close N` with a confirmation comment.
4. **Same commit: code + roadmap tick + journal entry.** Per
   `memory/feedback_roadmap_and_journal_per_commit.md`. No "docs
   follow-up" commits. Before `git add`, run the 30-second check:
   roadmap line ticked? journal entry added? issue filed if needed?
5. **No Claude attribution in commits.** Per
   `memory/feedback_no_co_authored_by.md`. No `Co-Authored-By` line,
   no "🤖 Generated with Claude Code" footer.
6. **Build + lint clean before commit.** `pnpm build` and
   `pnpm lint`. Both should exit 0.
7. **Hand verification back to the user with a specific URL + what
   to look at.** Don't just say "should work now".

## User communication notes

- Wants momentum. Short, decisive answers. No long trade-off essays.
- Drops screenshots / PDFs / files in `review/` or the repo root.
  Always `Read()` them.
- Doesn't speak fluent design — translates outcomes ("books too far
  back on z-axis") into component changes. Don't push back asking
  for spec values; pick reasonable defaults and let them iterate.
- Cuts microcopy ruthlessly. Ship less text by default.
- Friendly. Don't apologise excessively. Fix + move.
- Will sometimes tell you "do all the things" — still file each as
  an issue, still tick the roadmap, still update the journal.

## Things to NOT do

- Don't break mascot colour separation (hardware `FACE_STROKE`,
  accents `currentColor`).
- Don't make hero book cards clickable (`asStatic={true}`).
- Don't put `ai@gravity.fast` in any non-historical source.
- Don't introduce `React.Children.only()` (React 19 + Turbopack
  trip).
- Don't create `tailwind.config.ts` (Tailwind v4 is CSS-first).
- Don't bypass `scripts/supabase-with-env.sh` for supabase CLI
  commands.
- Don't trust your own past commits — grep to verify.
- Don't write to the security skill or use it against any host that
  isn't localhost or explicitly allowlisted by the user.

After reading `HANDOFF.md`, surface the two user-blocking items
above, then ask the user which of the five queued items they want
to start on (or what else is on their mind).
