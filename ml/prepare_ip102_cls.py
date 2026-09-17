"""Extract IP102 v1.1 (classification) and build a resized ImageFolder cache.

Usage (from repo root):
    python ml/prepare_ip102_cls.py --tar "D:/path/ip102_v1.1-001.tar" [--max-side 320]

Reads  ip102_v1.1/{images/*.jpg, train.txt, val.txt, test.txt}   ("<file> <label>" per line)
       plus the class list (Classification/classes.txt, "<1-based id> <name>")
Writes ml/datasets/ip102_cls_cache/{train,val,test}/<label>/<file>.jpg
       ml/datasets/ip102_cls_cache/classes.json    (label id -> species name)
"""

from __future__ import annotations

import argparse
import json
import re
import tarfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps

ML_DIR = Path(__file__).resolve().parent
RAW_DIR = ML_DIR / "datasets" / "ip102_cls_raw"
CACHE_DIR = ML_DIR / "datasets" / "ip102_cls_cache"
DEFAULT_CLASSES = ML_DIR / "datasets" / "ip102_det" / "classes.txt"


def extract(tar_path: Path) -> Path:
    marker = RAW_DIR / ".extracted"
    if marker.exists():
        return RAW_DIR / "ip102_v1.1"
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Extracting {tar_path} ...")
    with tarfile.open(tar_path) as tf:
        tf.extractall(RAW_DIR, filter="data")
    marker.touch()
    return RAW_DIR / "ip102_v1.1"


def parse_classes(path: Path) -> dict[int, str]:
    names: dict[int, str] = {}
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        m = re.match(r"\s*(\d+)\s+(.+?)\s*$", line)
        if m:
            names[int(m.group(1)) - 1] = m.group(2).strip()  # file is 1-based, labels are 0-based
    return names


def convert_one(src: Path, dst: Path, max_side: int) -> bool:
    if dst.exists():
        return True
    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img).convert("RGB")
            img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
            dst.parent.mkdir(parents=True, exist_ok=True)
            img.save(dst, "JPEG", quality=90)
        return True
    except Exception as exc:
        print(f"skip {src}: {exc}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tar", type=Path, required=True)
    parser.add_argument("--classes", type=Path, default=DEFAULT_CLASSES)
    parser.add_argument("--max-side", type=int, default=320)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    root = extract(args.tar)
    names = parse_classes(args.classes)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    (CACHE_DIR / "classes.json").write_text(json.dumps(names, indent=1))

    jobs: list[tuple[Path, Path]] = []
    counts: dict[str, int] = {}
    for split in ("train", "val", "test"):
        n = 0
        for line in (root / f"{split}.txt").read_text().splitlines():
            parts = line.split()
            if len(parts) != 2:
                continue
            fname, label = parts
            jobs.append((root / "images" / fname, CACHE_DIR / split / label / fname))
            n += 1
        counts[split] = n
    print(f"{len(jobs)} images ({counts}); {len(names)} classes; resizing to max side {args.max_side}px ...")

    ok = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for i, done in enumerate(pool.map(lambda j: convert_one(j[0], j[1], args.max_side), jobs), 1):
            ok += int(done)
            if i % 10000 == 0:
                print(f"  {i}/{len(jobs)}")
    print(f"Done: {ok}/{len(jobs)} written to {CACHE_DIR}")


if __name__ == "__main__":
    main()
