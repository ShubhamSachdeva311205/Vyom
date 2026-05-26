# Book covers — raw input

Drop the 7 combined front+back cover images here. The processing
script (`scripts/process-book-covers.py`) reads from this folder,
crops the **right half** of each image (the front cover), resizes,
and writes WebP files to `public/book-covers/`.

## Required filenames

The script matches by exact filename → book slug. Use these names
(any common image extension is fine — `.png`, `.jpg`, `.jpeg`, `.webp`):

| Filename | Book |
|---|---|
| `ibdp-hindi-b-hl-reading.png` | IBDP Hindi B HL — Reading |
| `ibdp-hindi-b-sl-reading.png` | IBDP Hindi B SL — Reading |
| `ibdp-hindi-b-sl-io.png` | IBDP Hindi B SL-IO |
| `ibdp-hindi-b-hl-io.png` | IBDP Hindi B HL-IO |
| `ibdp-hindi-b-shravan-lekhan.png` | IBDP Shravan Lekhan (Listening) |
| `igcse-hindi-paper-1.png` | IGCSE Hindi Paper 1 (Reading & Writing) |
| `igcse-hindi-paper-2-listening.png` | IGCSE Hindi Paper 2 (Listening) |

## Conventions

- **Front cover is the RIGHT half** of every image. (If a particular file
  has front on the left instead, rename it with a `.fliplr` infix —
  e.g. `ibdp-hindi-b-hl-reading.fliplr.png` — and the script will
  crop the left half instead.)
- Source images can be any size; the script will downscale.
- Output target: max 800px wide, WebP at quality 85.

## Running the script

After dropping files here:

```bash
python scripts/process-book-covers.py
```

Outputs land in `public/book-covers/<slug>.webp`. Safe to re-run —
overwrites cleanly.
