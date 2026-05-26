# Prompt template

Copy this file into a new `image-prompts/<slug>/prompt.md` whenever I
need to hand off an image to be generated.

---

## What we need

[One sentence on the artefact. e.g. "A 1200×630 OG image for the
IBDP curriculum landing page."]

## Style direction

- Brand palette: emerald (`oklch(0.58 0.16 168)` ish), deep emerald,
  warm amber as accent.
- Mood: [calm / cinematic / playful / scholarly — pick 1-2].
- Reference sites: Mindspace, Zen browser, Superlist, matvoyce.tv.
- Avoid: AI-SaaS aesthetic, heavy blur, garish gradients, stock-photo
  vibe, smiling-stock-people.

## Composition

- Dimensions: [e.g. 1200×630].
- Aspect ratio: [16:9, 1:1, 4:5, etc.].
- Subject placement: [e.g. "subject in the right third, copy area in
  the left two-thirds"].

## Hard constraints

- No copyrighted characters.
- No text rendered into the image (we add text in code).
- No human faces unless explicitly requested.

## Reference material

Drop any reference images, SVGs, or screenshots in `./reference/`.

## Output

- Save as `output.png` / `output.webp` in this folder.
- Multiple variants: `output-1.png`, `output-2.png`, etc.
