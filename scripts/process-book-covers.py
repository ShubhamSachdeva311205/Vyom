#!/usr/bin/env python3
"""
Book cover processor.

Reads source images from `book-covers-raw/`, crops the front cover
(the right half by default; left half if the filename contains
`.fliplr`), resizes to a max width, and writes WebP files to
`public/book-covers/` named by book slug.

Usage:
    python scripts/process-book-covers.py
    python scripts/process-book-covers.py --input <path> --output <path>
    python scripts/process-book-covers.py --max-width 1000 --quality 90

Dependencies (auto-installed if missing):
    pip install Pillow
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable

# ----------------------------------------------------------------
# Dependency bootstrap
# ----------------------------------------------------------------
try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...", file=sys.stderr)
    subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "Pillow"], check=True)
    from PIL import Image  # noqa: E402


# ----------------------------------------------------------------
# Known book slugs — must match supabase/seed.sql
# ----------------------------------------------------------------
KNOWN_SLUGS: set[str] = {
    "ibdp-hindi-b-hl-reading",
    "ibdp-hindi-b-sl-reading",
    "ibdp-hindi-b-sl-io",
    "ibdp-hindi-b-hl-io",
    "ibdp-hindi-b-shravan-lekhan",
    "igcse-hindi-paper-1",
    "igcse-hindi-paper-2-listening",
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
FLIP_INFIX_PATTERN = re.compile(r"\.fliplr$", re.IGNORECASE)


def extract_slug(filename: str) -> tuple[str, bool]:
    """Returns (slug, flipped) — flipped=True means front is on the LEFT."""
    stem = Path(filename).stem
    flipped = False
    if stem.lower().endswith(".fliplr"):
        flipped = True
        stem = FLIP_INFIX_PATTERN.sub("", stem)
    return stem, flipped


def crop_front_cover(img: Image.Image, flipped: bool) -> Image.Image:
    width, height = img.size
    half = width // 2
    if flipped:
        return img.crop((0, 0, half, height))
    return img.crop((half, 0, width, height))


def resize_to_max_width(img: Image.Image, max_width: int) -> Image.Image:
    if img.width <= max_width:
        return img
    ratio = max_width / img.width
    new_size = (max_width, int(img.height * ratio))
    return img.resize(new_size, Image.LANCZOS)


def find_source_images(input_dir: Path) -> Iterable[Path]:
    for p in sorted(input_dir.iterdir()):
        if p.suffix.lower() in IMAGE_EXTENSIONS:
            yield p


def process(input_dir: Path, output_dir: Path, max_width: int, quality: int) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)

    processed = 0
    unknown: list[str] = []
    missing = set(KNOWN_SLUGS)

    for src in find_source_images(input_dir):
        slug, flipped = extract_slug(src.name)

        if slug not in KNOWN_SLUGS:
            unknown.append(src.name)
            continue

        with Image.open(src) as img:
            img = img.convert("RGB")
            cropped = crop_front_cover(img, flipped)
            resized = resize_to_max_width(cropped, max_width)
            out_path = output_dir / f"{slug}.webp"
            resized.save(out_path, "WEBP", quality=quality, method=6)

        side = "left" if flipped else "right"
        rel = out_path.relative_to(Path.cwd()) if out_path.is_relative_to(Path.cwd()) else out_path
        print(f"  + {src.name} -> {rel} ({side} half, {resized.size[0]}x{resized.size[1]})")
        processed += 1
        missing.discard(slug)

    if unknown:
        print()
        print(f"!  Skipped {len(unknown)} unrecognised file(s):")
        for u in unknown:
            print(f"     - {u}")
        print("   (Expected filenames match book slugs from supabase/seed.sql.")
        print("    Use a `.fliplr` infix if the front is on the left.)")

    if missing:
        print()
        print(f"!  Missing {len(missing)} expected cover(s):")
        for slug in sorted(missing):
            print(f"     - {slug}.<ext>")

    print()
    rel_out = output_dir.relative_to(Path.cwd()) if output_dir.is_relative_to(Path.cwd()) else output_dir
    print(f"Done. Processed {processed} cover(s). Output: {rel_out}/")
    return 0 if processed > 0 else 1


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent

    parser = argparse.ArgumentParser(description="Process book cover images.")
    parser.add_argument(
        "--input",
        type=Path,
        default=repo_root / "book-covers-raw",
        help="Source folder containing combined front+back images.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=repo_root / "public" / "book-covers",
        help="Destination folder for cropped WebP front covers.",
    )
    parser.add_argument("--max-width", type=int, default=800, help="Max width in px.")
    parser.add_argument("--quality", type=int, default=85, help="WebP quality (1-100).")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Input folder doesn't exist: {args.input}", file=sys.stderr)
        return 1

    sources = list(find_source_images(args.input))
    if not sources:
        print(f"No image files in {args.input}/", file=sys.stderr)
        print("Drop the 7 cover images first - see book-covers-raw/README.md.")
        return 1

    return process(args.input, args.output, args.max_width, args.quality)


if __name__ == "__main__":
    sys.exit(main())
