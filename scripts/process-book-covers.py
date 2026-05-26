#!/usr/bin/env python3
"""
Book cover processor with OCR classification.

For each image in `book-covers/book-covers-raw/`:
  1. Crop the right half (the front cover, conventionally).
  2. Run Tesseract OCR on the cropped half.
  3. Match the extracted text against a keyword table to pick the
     correct book slug.
  4. Resize to max-width, save as `public/book-covers/<slug>.webp`.

Tesseract binary is required (`brew install tesseract`). Pillow +
pytesseract auto-install via pip on first run.

Pass `--no-ocr` to fall back to filename-based matching.

Usage:
    python scripts/process-book-covers.py
    python scripts/process-book-covers.py --no-ocr
    python scripts/process-book-covers.py --debug-ocr
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable, Optional

# ----------------------------------------------------------------
# Dependency bootstrap
# ----------------------------------------------------------------
def ensure_package(pkg: str, import_name: Optional[str] = None) -> None:
    mod_name = import_name or pkg
    try:
        __import__(mod_name)
    except ImportError:
        print(f"Installing {pkg}...", file=sys.stderr)
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", pkg], check=True)


ensure_package("Pillow", "PIL")
ensure_package("pytesseract")

from PIL import Image, ImageOps  # noqa: E402
import pytesseract  # noqa: E402

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


def extract_slug_from_filename(filename: str) -> tuple[Optional[str], bool]:
    stem = Path(filename).stem
    flipped = False
    if stem.lower().endswith(".fliplr"):
        flipped = True
        stem = FLIP_INFIX_PATTERN.sub("", stem)
    return (stem if stem in KNOWN_SLUGS else None), flipped


def load_manual_map(input_dir: Path) -> dict[str, str]:
    """
    Optional `covers-map.txt` in the input directory. Format: one
    `filename slug` pair per line, hash-comments allowed. Lets the
    user nail edge cases OCR can't reach (Devanagari, low contrast,
    photo-of-photo, etc.).
    """
    path = input_dir / "covers-map.txt"
    if not path.exists():
        return {}
    mapping: dict[str, str] = {}
    for raw in path.read_text().splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        parts = line.rsplit(None, 1)
        if len(parts) != 2:
            continue
        fname, slug = parts[0].strip(), parts[1].strip()
        if slug in KNOWN_SLUGS:
            mapping[fname] = slug
    return mapping


# ----------------------------------------------------------------
# OCR classification
# ----------------------------------------------------------------
def classify_from_text(text: str) -> Optional[str]:
    """
    Keyword-based classifier. Order matters: more specific keywords
    must run before more general ones (LISTENING > HL, IO > Reading).
    """
    if not text:
        return None
    t = re.sub(r"\s+", " ", text.upper())

    is_ibdp = "IBDP" in t or "IB DP" in t or "IB-DP" in t
    is_igcse = "IGCSE" in t

    if is_ibdp:
        # Listening/Shravan FIRST — covers also mention HL/SL but the book is Shravan.
        if "SHRAVAN" in t or "SHRAWAN" in t or "LISTENIN" in t or "श्रवण" in text:
            return "ibdp-hindi-b-shravan-lekhan"
        # IO/Moukhik FIRST — covers say HL or SL but the book is the IO companion.
        if (
            "SL-IO" in t or "SL IO" in t or "SLIO" in t
            or ("SL" in t and ("MOUKHIK" in t or "MAUKHIK" in t or "INDIVIDUAL ORAL" in t))
            or ("MANAK STAR" in t and "MOUKHIK" in t)
        ):
            return "ibdp-hindi-b-sl-io"
        if (
            "HL-IO" in t or "HL IO" in t or "HLIO" in t
            or ("HL" in t and ("MOUKHIK" in t or "MAUKHIK" in t or "INDIVIDUAL ORAL" in t))
            or ("UCCH STAR" in t and "MOUKHIK" in t)
        ):
            return "ibdp-hindi-b-hl-io"
        # Plain reading editions
        if "HL" in t:
            return "ibdp-hindi-b-hl-reading"
        if "SL" in t:
            return "ibdp-hindi-b-sl-reading"

    if is_igcse:
        if "PAPER 2" in t or "PAPER2" in t or "LISTENIN" in t or "श्रवण" in text:
            return "igcse-hindi-paper-2-listening"
        if "PAPER 1" in t or "PAPER1" in t or "READING AND WRITING" in t or "READING & WRITING" in t:
            return "igcse-hindi-paper-1"
        # Bare IGCSE with no paper indicator — default to Paper 1 (Reading & Writing
        # is the more common/flagship edition).
        return "igcse-hindi-paper-1"

    return None


def preprocess_for_ocr(img: Image.Image) -> Image.Image:
    g = img.convert("L")
    g = ImageOps.autocontrast(g, cutoff=2)
    return g


def ocr_text(img: Image.Image) -> str:
    """Try Hindi+English first if the language pack is present, else fall back to English."""
    pre = preprocess_for_ocr(img)
    try:
        return pytesseract.image_to_string(pre, lang="hin+eng")
    except pytesseract.TesseractError:
        return pytesseract.image_to_string(pre)


# ----------------------------------------------------------------
# Image helpers
# ----------------------------------------------------------------
def crop_right_half(img: Image.Image) -> Image.Image:
    w, h = img.size
    return img.crop((w // 2, 0, w, h))


def crop_left_half(img: Image.Image) -> Image.Image:
    w, h = img.size
    return img.crop((0, 0, w // 2, h))


def resize_to_max_width(img: Image.Image, max_width: int) -> Image.Image:
    if img.width <= max_width:
        return img
    ratio = max_width / img.width
    return img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)


def find_source_images(input_dir: Path) -> Iterable[Path]:
    for p in sorted(input_dir.iterdir()):
        if p.suffix.lower() in IMAGE_EXTENSIONS and not p.name.startswith("."):
            yield p


# ----------------------------------------------------------------
# Pipeline
# ----------------------------------------------------------------
def check_tesseract() -> bool:
    if shutil.which("tesseract"):
        return True
    print("!  Tesseract binary not found.", file=sys.stderr)
    print("   Install with:  brew install tesseract", file=sys.stderr)
    return False


def classify_with_ocr(src: Path) -> tuple[Optional[str], bool, str]:
    with Image.open(src) as img:
        img = img.convert("RGB")
        right_half = crop_right_half(img)
        right_text = ocr_text(right_half)
        slug = classify_from_text(right_text)
        if slug:
            return slug, False, right_text
        left_half = crop_left_half(img)
        left_text = ocr_text(left_half)
        slug = classify_from_text(left_text)
        if slug:
            return slug, True, left_text
        return None, False, right_text


def save_front(src: Path, output_dir: Path, slug: str, flipped: bool, max_width: int, quality: int) -> Path:
    with Image.open(src) as img:
        img = img.convert("RGB")
        front = crop_left_half(img) if flipped else crop_right_half(img)
        front = resize_to_max_width(front, max_width)
        out_path = output_dir / f"{slug}.webp"
        front.save(out_path, "WEBP", quality=quality, method=6)
        return out_path


def process(input_dir: Path, output_dir: Path, max_width: int, quality: int,
            use_ocr: bool, debug: bool) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)

    if use_ocr and not check_tesseract():
        return 2

    manual_map = load_manual_map(input_dir)
    if manual_map:
        print(f"i  Loaded {len(manual_map)} manual override(s) from covers-map.txt.")

    processed = 0
    unmatched: list[tuple[Path, str]] = []
    missing = set(KNOWN_SLUGS)

    for src in find_source_images(input_dir):
        # Manual override wins over OCR or filename matching.
        manual_slug = manual_map.get(src.name)
        ocr_t = ""
        if manual_slug:
            slug, flipped, source = manual_slug, False, "manual"
        elif use_ocr:
            slug, flipped, ocr_t = classify_with_ocr(src)
            source = "ocr"
            if not slug:
                fname_slug, flipped = extract_slug_from_filename(src.name)
                if fname_slug:
                    slug, source = fname_slug, "filename"
        else:
            slug, flipped = extract_slug_from_filename(src.name)
            source = "filename"

        if not slug:
            unmatched.append((src, ocr_t))
            continue

        out = save_front(src, output_dir, slug, flipped, max_width, quality)
        side = "left" if flipped else "right"
        rel = out.relative_to(Path.cwd()) if out.is_relative_to(Path.cwd()) else out
        print(f"  + {src.name}  ->  {rel}  ({source}, {side} half)")
        if debug and ocr_t:
            snippet = re.sub(r"\s+", " ", ocr_t)[:140]
            print(f"      ocr: {snippet}")
        processed += 1
        missing.discard(slug)

    if unmatched:
        print()
        print(f"!  Could not classify {len(unmatched)} file(s):")
        for src, t in unmatched:
            snippet = re.sub(r"\s+", " ", t)[:120] if t else "(no OCR text)"
            print(f"   - {src.name}")
            print(f"      ocr: {snippet}")

    if missing:
        print()
        print(f"!  Missing {len(missing)} expected slug(s):")
        for s in sorted(missing):
            print(f"   - {s}.webp")

    print()
    rel_out = output_dir.relative_to(Path.cwd()) if output_dir.is_relative_to(Path.cwd()) else output_dir
    print(f"Done. Processed {processed} cover(s). Output: {rel_out}/")
    return 0 if processed > 0 else 1


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent

    parser = argparse.ArgumentParser(description="Process book cover images with OCR.")
    parser.add_argument(
        "--input",
        type=Path,
        default=repo_root / "book-covers" / "book-covers-raw",
        help="Source folder (default: book-covers/book-covers-raw/).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=repo_root / "public" / "book-covers",
        help="Destination folder (default: public/book-covers/).",
    )
    parser.add_argument("--max-width", type=int, default=800)
    parser.add_argument("--quality", type=int, default=85)
    parser.add_argument("--no-ocr", action="store_true", help="Skip OCR; use filename-based matching only.")
    parser.add_argument("--debug-ocr", action="store_true", help="Print extracted OCR text per file.")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Input folder doesn't exist: {args.input}", file=sys.stderr)
        return 1

    sources = list(find_source_images(args.input))
    if not sources:
        print(f"No image files in {args.input}/", file=sys.stderr)
        return 1

    return process(
        args.input,
        args.output,
        args.max_width,
        args.quality,
        use_ocr=not args.no_ocr,
        debug=args.debug_ocr,
    )


if __name__ == "__main__":
    sys.exit(main())
