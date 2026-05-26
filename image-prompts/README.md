# Image generation handoff

When I need an image generated (hero photography, illustration,
texture, mascot variant beyond SVG, OG card variation, anything I
can't draw in code), I drop a folder here with two things:

```
image-prompts/
└── <slug>/
    ├── prompt.md     — what to generate + style + dimensions
    └── reference/    — optional: SVGs, screenshots, mood images
```

You generate via **Kling AI** (or any other tool that suits) and
drop the result back into the same folder as `output.<ext>`. I pick
it up from there.

## Folder conventions

- `<slug>`: kebab-case description of what we're generating (e.g.
  `homepage-hero-bookshelf`, `student-mascot-illustration-v2`).
- `prompt.md`: one prompt per file. Includes style direction,
  target dimensions, mood references, and a "do not include" list.
- `reference/`: optional source material. Drop SVGs of the
  current state, screenshots of moodboards, hex codes for the
  palette, etc.

## Example slot

See `_examples/` for a template I'll use whenever I create a real
prompt entry.

## Naming the output

When you have the generated image, save it as `output.png`,
`output.webp`, or `output.jpeg` inside the slug folder. If you
generate several variants, name them `output-1.png`, `output-2.png`,
etc. I'll pick which one we use in code.
