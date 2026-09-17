"""Build a resized, RGB-only copy of PlantDoc so training is not bottlenecked on JPEG decoding.

Usage:
    python ml/prepare_plantdoc.py [--max-side 512]

Reads  ml/datasets/plantdoc/{train,test}/<class>/*.jpg  (git clone of pratikkayal/PlantDoc-Dataset)
Writes ml/datasets/plantdoc_cache/{train,test}/<class>/*.jpg
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps

from plantdoc_common import CACHE_DIR, DATASET_DIR, list_images


def convert_one(src: Path, dst: Path, max_side: int) -> bool:
    if dst.exists():
        return True
    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
            dst.parent.mkdir(parents=True, exist_ok=True)
            img.save(dst, "JPEG", quality=92)
        return True
    except Exception as exc:  # corrupt / unreadable file
        print(f"skip {src}: {exc}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-side", type=int, default=512)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    if not DATASET_DIR.exists():
        raise SystemExit(f"Dataset not found at {DATASET_DIR}. Clone PlantDoc-Dataset there first.")

    jobs: list[tuple[Path, Path]] = []
    for split in ("train", "test"):
        split_dir = DATASET_DIR / split
        for class_dir in sorted(p for p in split_dir.iterdir() if p.is_dir()):
            for src in list_images(class_dir):
                dst = CACHE_DIR / split / class_dir.name / (src.stem + ".jpg")
                jobs.append((src, dst))

    print(f"Converting {len(jobs)} images to max side {args.max_side}px ...")
    ok = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for done in pool.map(lambda j: convert_one(j[0], j[1], args.max_side), jobs):
            ok += int(done)
    print(f"Done: {ok}/{len(jobs)} written to {CACHE_DIR}")


if __name__ == "__main__":
    main()
