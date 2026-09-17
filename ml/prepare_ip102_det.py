"""Convert the IP102 detection subset (VOC2007 layout) into Ultralytics YOLO format.

Expected input (extract Annotations.tar / JPEGImages.tar here first):
    ml/datasets/ip102_det/Annotations/*.xml
    ml/datasets/ip102_det/JPEGImages/*.jpg
    ml/datasets/ip102_det/ImageSets/Main/{trainval,test}.txt
    ml/datasets/ip102_det/classes.txt          (102 lines: "<id> <name>")

Output:
    ml/datasets/ip102_yolo/images/{train,val,test}/   (hard links, no extra disk)
    ml/datasets/ip102_yolo/labels/{train,val,test}/   (YOLO txt: cls cx cy w h)
    ml/datasets/ip102_yolo/ip102.yaml                 (dataset config for `yolo train`)
    ml/ip102_classes.json                             (id -> pest name, used at inference)

Usage:  python ml/prepare_ip102_det.py [--val-fraction 0.1]
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import shutil
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image

ML_DIR = Path(__file__).resolve().parent
SRC = ML_DIR / "datasets" / "ip102_det"
DST = ML_DIR / "datasets" / "ip102_yolo"
CLASSES_JSON = ML_DIR / "ip102_classes.json"


def read_classes(path: Path) -> list[str]:
    names = []
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        m = re.match(r"\s*(\d+)\s+(.*)", line)
        if m:
            names.append(re.sub(r"\s+", " ", m.group(2)).strip())
    if len(names) != 102:
        raise SystemExit(f"Expected 102 class names, found {len(names)} in {path}")
    return names


def load_xml(xml_path: Path) -> ET.Element:
    """Parse VOC xml, tolerating IP102 files that have junk/duplicate elements after the root."""
    text = xml_path.read_text(encoding="utf-8", errors="ignore")
    text = re.sub(r"<\?xml[^>]*\?>", "", text)
    try:
        return ET.fromstring(text)
    except ET.ParseError:
        wrapped = ET.fromstring(f"<wrap>{text}</wrap>")
        root = wrapped.find("annotation")
        if root is None:
            raise
        # merge objects from any duplicate <annotation> blocks
        for extra in wrapped.findall("annotation")[1:]:
            for obj in extra.findall("object"):
                root.append(obj)
        return root


def parse_voc(xml_path: Path, img_path: Path, num_classes: int):
    root = load_xml(xml_path)
    size = root.find("size")
    w = int(float(size.findtext("width", "0"))) if size is not None else 0
    h = int(float(size.findtext("height", "0"))) if size is not None else 0
    if w <= 0 or h <= 0:
        with Image.open(img_path) as im:
            w, h = im.size
    boxes = []
    for obj in root.findall("object"):
        try:
            cls = int(obj.findtext("name", "").strip())
        except ValueError:
            continue
        if not 0 <= cls < num_classes:
            continue
        bb = obj.find("bndbox")
        xmin = max(0.0, float(bb.findtext("xmin")))
        ymin = max(0.0, float(bb.findtext("ymin")))
        xmax = min(float(w), float(bb.findtext("xmax")))
        ymax = min(float(h), float(bb.findtext("ymax")))
        if xmax - xmin < 2 or ymax - ymin < 2:
            continue
        boxes.append((cls, (xmin + xmax) / 2 / w, (ymin + ymax) / 2 / h, (xmax - xmin) / w, (ymax - ymin) / h))
    return boxes


def link_or_copy(src: Path, dst: Path) -> None:
    if dst.exists():
        return
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--val-fraction", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--backgrounds", type=Path, default=None,
        help="folder with {train,test}/**/*.jpg of pest-free images (e.g. the PlantDoc cache) to add as negatives",
    )
    args = parser.parse_args()
    random.seed(args.seed)

    names = read_classes(SRC / "classes.txt")
    CLASSES_JSON.write_text(json.dumps(names, indent=2))

    ids_trainval = (SRC / "ImageSets" / "Main" / "trainval.txt").read_text().split()
    ids_test = (SRC / "ImageSets" / "Main" / "test.txt").read_text().split()

    # Stratify the val split by each image's most frequent class.
    primary: dict[str, int] = {}
    labels: dict[str, list] = {}
    missing = 0
    for img_id in ids_trainval + ids_test:
        xml_path, img_path = SRC / "Annotations" / f"{img_id}.xml", SRC / "JPEGImages" / f"{img_id}.jpg"
        if not xml_path.exists() or not img_path.exists():
            missing += 1
            continue
        boxes = parse_voc(xml_path, img_path, len(names))
        labels[img_id] = boxes
        if boxes:
            primary[img_id] = Counter(b[0] for b in boxes).most_common(1)[0][0]

    by_class: dict[int, list[str]] = defaultdict(list)
    for img_id in ids_trainval:
        if img_id in primary:
            by_class[primary[img_id]].append(img_id)
    train_ids, val_ids = [], []
    for ids in by_class.values():
        random.shuffle(ids)
        n_val = int(round(len(ids) * args.val_fraction))
        val_ids += ids[:n_val]
        train_ids += ids[n_val:]
    test_ids = [i for i in ids_test if i in labels]

    for split, ids in (("train", train_ids), ("val", val_ids), ("test", test_ids)):
        (DST / "images" / split).mkdir(parents=True, exist_ok=True)
        (DST / "labels" / split).mkdir(parents=True, exist_ok=True)
        for img_id in ids:
            link_or_copy(SRC / "JPEGImages" / f"{img_id}.jpg", DST / "images" / split / f"{img_id}.jpg")
            lines = [f"{c} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}" for c, cx, cy, w, h in labels[img_id]]
            (DST / "labels" / split / f"{img_id}.txt").write_text("\n".join(lines) + ("\n" if lines else ""))
        print(f"{split}: {len(ids)} images, {sum(len(labels[i]) for i in ids)} boxes")

    # Optional background negatives: leaf photos without pests teach the detector that disease
    # lesions and leaf texture are not insects. Empty label files mark them as backgrounds.
    train_sources, val_sources = ["images/train"], ["images/val"]
    if args.backgrounds:
        for src_split, dst_split, sources in (("train", "train_bg", train_sources), ("test", "val_bg", val_sources)):
            src_dir = args.backgrounds / src_split
            if not src_dir.exists():
                continue
            (DST / "images" / dst_split).mkdir(parents=True, exist_ok=True)
            (DST / "labels" / dst_split).mkdir(parents=True, exist_ok=True)
            count = 0
            for i, img in enumerate(sorted(src_dir.rglob("*.jpg"))):
                name = f"bg_{i:05d}.jpg"  # short names: PlantDoc filenames can exceed Windows path limits
                link_or_copy(img, DST / "images" / dst_split / name)
                (DST / "labels" / dst_split / (Path(name).stem + ".txt")).write_text("")
                count += 1
            sources.append(f"images/{dst_split}")
            print(f"{dst_split}: {count} background images")

    def yaml_list(items: list[str]) -> str:
        return items[0] if len(items) == 1 else "[" + ", ".join(items) + "]"

    yaml_names = "\n".join(f"  {i}: {n}" for i, n in enumerate(names))
    (DST / "ip102.yaml").write_text(
        f"# IP102 pest detection (VOC2007 subset) in YOLO format\n"
        f"path: {DST.as_posix()}\n"
        f"train: {yaml_list(train_sources)}\nval: {yaml_list(val_sources)}\ntest: images/test\n\n"
        f"names:\n{yaml_names}\n"
    )
    print(f"Skipped {missing} ids with missing xml/jpg. Wrote {DST / 'ip102.yaml'}")


if __name__ == "__main__":
    main()
