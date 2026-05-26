# Prompt for the next Claude Code session

Paste everything below this line into the new session as your first
message. The full handoff is in `HANDOFF.md` at the repo root —
this prompt points you there.

---

You're continuing work on Advaita, an e-commerce platform for IBDP
and IGCSE Hindi study books. The previous session ran out of
context. **First action: read `HANDOFF.md` end-to-end** — it covers
the stack, the mascot system, the hero system, the auth model, the
workflow conventions (especially CLAUDE.md §13 GitHub Issues
tracking), the user's communication style, and a list of known
gotchas. Don't skip it.

Also read these three files in order before writing any code:

1. `.claude/CLAUDE.md` — architecture rules, especially §1 (Clarification
   Gate) and §13 (GitHub Issues workflow) and §14 (email identities).
2. `FULL_FEATURE_REFERENCE.md` — ground-truth product spec.
3. `BUILD-JOURNAL.md` — what's shipped + recent lessons (read the
   most recent Phase 1.6 section closely).

Then check open work:

- `git log --oneline -15`
- `gh issue list --state open`

## Immediate bug to fix

User's words from the last session:

> the books are really far back on the z-axis bring them closer for
> all the home page and ibdp and igcse, the home page right before
> this one looked better

The previous commit (`e5fb59e`) shrank side books to size=`md`
(192 px) and pushed them wider (offsetX `260 + (depth-1) * 160` /
`150`). User wants them feeling closer + larger — the state from
commit `3f5d585` looked better.

Likely fix:
- Side cards back to `size="lg"` (288 px).
- Reduce offsetX to roughly `200 + (depth-1) * 100` for layered
  hero and `220 + (depth-1) * 110` for scroll-reveal.
- Reduce rotateY from `-22°` to `~-15°` (less perspective tilt
  reads as closer).
- Reduce scale shrink: was `0.92 - depth * 0.05`, try
  `0.94 - depth * 0.04` so deeper books don't disappear.

Files to touch:
- `src/components/features/store/layered-book-hero.tsx`
- `src/components/features/store/scroll-reveal-hero.tsx`

## Workflow rules — apply every time

1. **File a GitHub Issue first** with `gh issue create` using the
   bug-report template. Capture: what user said, root cause, fix.
2. **Read each file before editing it** — `Edit()` requires a prior
   `Read()` and silently fails otherwise. This has cost multiple
   commits in earlier sessions. **After editing, grep the file** for
   the new content to confirm it landed.
3. **Build + smoke test** all three storefront pages (`/`, `/ibdp`,
   `/igcse`) before committing.
4. **Commit with `Closes #<N>`** in the body so the push auto-closes
   the issue. Use the heredoc style for multi-line messages.
5. **Push.** `gh issue list --state open` after push to confirm
   nothing got mis-closed via wrong issue numbers.
6. **Update BUILD-JOURNAL.md** at the end of the batch. Grep-verify
   your addition landed.

## User communication notes

- Wants short, decisive answers. No long trade-off essays.
- Drops screenshots in `review/`. Read them via the Read tool.
- Doesn't speak fluent design — translates intent ("books too far
  back") into component changes.
- Cuts microcopy ruthlessly. Don't add verbose taglines.
- Will tell you to "do all the things" — you still need to file
  issues, even for things you're doing immediately, and even when
  bundling several into one commit.
- Genuinely friendly. Don't apologise excessively. Fix + move.

## Things to NOT do

- Don't break the mascot color separation (hardware uses
  `FACE_STROKE`, accent uses `currentColor`).
- Don't make hero book cards clickable (they're `asStatic={true}`
  with no zoom hover).
- Don't put `ai@gravity.fast` in any non-git-attribution source.
- Don't introduce `React.Children.only()` (React 19 + Turbopack
  trips this).
- Don't create a `tailwind.config.ts` (Tailwind v4 is CSS-first via
  `globals.css` `@theme`).
- Don't bypass `scripts/supabase-with-env.sh` when running supabase
  CLI commands.
- Don't trust your own past commits — grep to verify.

Once you've fixed the z-axis bug, ask the user what's next. Likely
candidates: Phase 3 (cart + Razorpay + order confirmation), more
storefront polish, or Phase 5 admin tooling.
