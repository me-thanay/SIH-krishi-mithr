"""Build an ImageFolder cache of the Maize Nutrient Deficiency Dataset.

Source (nested folders, original spellings kept on disk):
    D:/Games/gta/Maize Nutrient Deficiency Dataset/**/{Helathy,Magnessium,Nitrogen,Phosphorous,Pottasium}

Writes ml/datasets/maize_def_cache/{train,val,test}/<canonical class>/*.jpg
and ml/datasets/maize_def_cache/classes.json  (folder -> suspected-deficiency label).
"""

from __future__ import annotations

import argparse
import json
import random
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps

from plantdoc_common import IMAGE_EXTS, ML_DIR

CACHE_DIR = ML_DIR / "datasets" / "maize_def_cache"
DEFAULT_SRC = Path(r"D:\Games\gta\Maize Nutrient Deficiency Dataset")

# Original folder name -> canonical class folder used for training.
FOLDER_MAP = {
    "helathy": "Healthy",
    "healthy": "Healthy",
    "magnessium": "Magnesium",
    "magnesium": "Magnesium",
    "nitrogen": "Nitrogen",
    "phosphorous": "Phosphorus",
    "phosphorus": "Phosphorus",
    "pottasium": "Potassium",
    "potassium": "Potassium",
}

# Crop-specific labels the API returns as `suspected_deficiency`.
DEFICIENCY_LABEL = {
    "Healthy": "none",
    "Magnesium": "Magnesium deficiency",
    "Nitrogen": "Nitrogen deficiency",
    "Phosphorus": "Phosphorus deficiency",
    "Potassium": "Potassium deficiency",
}


def find_class_dirs(root: Path) -> dict[str, Path]:
    found: dict[str, Path] = {}
    for path in root.rglob("*"):
        if not path.is_dir():
            continue
        key = FOLDER_MAP.get(path.name.strip().lower())
        if key and key not in found:
            found[key] = path
    return found


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
    except Exception as exc:
        print(f"skip {src}: {exc}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC)
    parser.add_argument("--max-side", type=int, default=512)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--val-fraction", type=float, default=0.15)
    parser.add_argument("--test-fraction", type=float, default=0.15)
    args = parser.parse_args()

    if not args.src.exists():
        raise SystemExit(f"Dataset not found at {args.src}")

    class_dirs = find_class_dirs(args.src)
    if len(class_dirs) < 2:
        raise SystemExit(f"Need at least 2 class folders under {args.src}, found {list(class_dirs)}")

    rng = random.Random(args.seed)
    jobs: list[tuple[Path, Path]] = []
    counts: dict[str, dict[str, int]] = {}
    for cls, folder in sorted(class_dirs.items()):
        files = sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)
        rng.shuffle(files)
        n = len(files)
        n_test = max(1, int(round(n * args.test_fraction)))
        n_val = max(1, int(round(n * args.val_fraction)))
        if n_test + n_val >= n:
            n_test = max(1, n // 5)
            n_val = max(1, n // 5)
        splits = {
            "test": files[:n_test],
            "val": files[n_test:n_test + n_val],
            "train": files[n_test + n_val:],
        }
        counts[cls] = {s: len(v) for s, v in splits.items()}
        for split, items in splits.items():
            for src in items:
                dst = CACHE_DIR / split / cls / (src.stem + ".jpg")
                jobs.append((src, dst))

    print(f"Converting {len(jobs)} maize images ...")
    ok = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for done in pool.map(lambda j: convert_one(j[0], j[1], args.max_side), jobs):
            ok += int(done)

    names = {cls: DEFICIENCY_LABEL[cls] for cls in class_dirs}
    names_path = CACHE_DIR / "classes.json"
    names_path.write_text(json.dumps(names, indent=2))
    print(f"Done: {ok}/{len(jobs)} -> {CACHE_DIR}")
    for cls, c in counts.items():
        print(f"  {cls:12s} train {c['train']:3d}  val {c['val']:3d}  test {c['test']:3d}  -> {names[cls]}")
    print(f"Wrote {names_path}")


if __name__ == "__main__":
    main()
