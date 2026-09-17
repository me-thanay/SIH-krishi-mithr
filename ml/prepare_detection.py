"""Build a YOLO-format dataset for locating leaves and insect pests.

Sources
  * IP102 detection (VOC2007 XML, 102 species)   -> class 1 `pest`  (species merged; the
    IP102 species classifier resolves the species from the crop afterwards)
  * PlantDoc-Object-Detection-Dataset (CSV boxes) -> class 0 `leaf`  (disease classes merged;
    the PlantDoc leaf classifier diagnoses the crop afterwards)

Usage (from repo root):
    python ml/prepare_detection.py

Expects
    ml/datasets/ip102_det/{Annotations,JPEGImages,ImageSets/Main/{trainval,test}.txt}
    ml/datasets/plantdoc_od/{TRAIN,TEST,train_labels.csv,test_labels.csv,_name_map.json}
Writes
    ml/datasets/yolo_leaf_pest/{images,labels}/{train,val,test}/ + data.yaml
"""

from __future__ import annotations

import csv
import json
import random
import shutil
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

from PIL import Image

ML_DIR = Path(__file__).resolve().parent
IP102_DIR = ML_DIR / "datasets" / "ip102_det"
PLANTDOC_OD_DIR = ML_DIR / "datasets" / "plantdoc_od"
OUT_DIR = ML_DIR / "datasets" / "yolo_leaf_pest"

CLASS_LEAF, CLASS_PEST = 0, 1
NAMES = {CLASS_LEAF: "leaf", CLASS_PEST: "pest"}
VAL_FRACTION = 0.1
SEED = 42


def yolo_line(cls: int, xmin: float, ymin: float, xmax: float, ymax: float, w: int, h: int) -> str | None:
    xmin, xmax = max(0.0, min(xmin, w)), max(0.0, min(xmax, w))
    ymin, ymax = max(0.0, min(ymin, h)), max(0.0, min(ymax, h))
    bw, bh = xmax - xmin, ymax - ymin
    if bw < 2 or bh < 2:
        return None
    cx, cy = (xmin + xmax) / 2 / w, (ymin + ymax) / 2 / h
    return f"{cls} {cx:.6f} {cy:.6f} {bw / w:.6f} {bh / h:.6f}"


def write_sample(split: str, src: Path, stem: str, lines: list[str]) -> None:
    img_dst = OUT_DIR / "images" / split / f"{stem}{src.suffix.lower()}"
    lbl_dst = OUT_DIR / "labels" / split / f"{stem}.txt"
    img_dst.parent.mkdir(parents=True, exist_ok=True)
    lbl_dst.parent.mkdir(parents=True, exist_ok=True)
    if not img_dst.exists():
        shutil.copyfile(src, img_dst)
    lbl_dst.write_text("\n".join(lines) + ("\n" if lines else ""))


def split_ids(ids: list[str]) -> tuple[list[str], list[str]]:
    rng = random.Random(SEED)
    ids = sorted(ids)
    rng.shuffle(ids)
    n_val = int(len(ids) * VAL_FRACTION)
    return ids[n_val:], ids[:n_val]


# ----------------------------------------------------------------------------- IP102 (pests)


def convert_ip102() -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    boxes = 0
    sets = IP102_DIR / "ImageSets" / "Main"
    trainval = (sets / "trainval.txt").read_text().split()
    test = (sets / "test.txt").read_text().split()
    train, val = split_ids(trainval)

    for split, ids in (("train", train), ("val", val), ("test", test)):
        for image_id in ids:
            xml_path = IP102_DIR / "Annotations" / f"{image_id}.xml"
            img_path = IP102_DIR / "JPEGImages" / f"{image_id}.jpg"
            if not xml_path.exists() or not img_path.exists():
                counts["ip102_missing"] += 1
                continue
            try:
                root = ET.parse(xml_path).getroot()
            except ET.ParseError:  # a few files contain the <annotation> block twice
                wrapped = ET.fromstring("<root>" + xml_path.read_text(encoding="utf-8", errors="ignore") + "</root>")
                root = wrapped.find("annotation")
                counts["ip102_repaired_xml"] += 1
            size = root.find("size")
            try:
                w, h = int(size.findtext("width")), int(size.findtext("height"))
                if w <= 0 or h <= 0:
                    raise ValueError
            except Exception:
                with Image.open(img_path) as im:
                    w, h = im.size
            lines = []
            for obj in root.iter("object"):
                bb = obj.find("bndbox")
                line = yolo_line(
                    CLASS_PEST,
                    float(bb.findtext("xmin")), float(bb.findtext("ymin")),
                    float(bb.findtext("xmax")), float(bb.findtext("ymax")), w, h,
                )
                if line:
                    lines.append(line)
            if not lines:
                counts["ip102_no_boxes"] += 1
                continue
            write_sample(split, img_path, f"ip_{image_id}", lines)
            counts[f"ip102_{split}"] += 1
            boxes += len(lines)
    counts["ip102_boxes"] = boxes
    return counts


# ----------------------------------------------------------------------------- PlantDoc-OD (leaves)


def convert_plantdoc_od() -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    name_map: dict[str, str] = json.loads((PLANTDOC_OD_DIR / "_name_map.json").read_text()) \
        if (PLANTDOC_OD_DIR / "_name_map.json").exists() else {}

    def load(csv_name: str, folder: str):
        rows: dict[str, list] = defaultdict(list)
        with open(PLANTDOC_OD_DIR / csv_name, newline="", encoding="utf-8") as fh:
            for r in csv.DictReader(fh):
                rows[r["filename"]].append(r)
        resolved = {}
        for fname, items in rows.items():
            rel = f"{folder}/{fname}"
            safe = name_map.get(rel, rel)
            path = PLANTDOC_OD_DIR / safe
            if not path.exists():
                counts["plantdoc_missing"] += 1
                continue
            resolved[fname] = (path, items)
        return resolved

    train_all = load("train_labels.csv", "TRAIN")
    test_all = load("test_labels.csv", "TEST")
    train_ids, val_ids = split_ids(list(train_all))

    boxes = 0
    for split, keys, table in (("train", train_ids, train_all), ("val", val_ids, train_all), ("test", list(test_all), test_all)):
        for i, fname in enumerate(keys):
            path, items = table[fname]
            try:
                w, h = int(items[0]["width"]), int(items[0]["height"])
            except ValueError:
                with Image.open(path) as im:
                    w, h = im.size
            lines = []
            for r in items:
                line = yolo_line(CLASS_LEAF, float(r["xmin"]), float(r["ymin"]), float(r["xmax"]), float(r["ymax"]), w, h)
                if line:
                    lines.append(line)
            if not lines:
                counts["plantdoc_no_boxes"] += 1
                continue
            stem = f"pd_{split}_{i:05d}"
            write_sample(split, path, stem, lines)
            counts[f"plantdoc_{split}"] += 1
            boxes += len(lines)
    counts["plantdoc_boxes"] = boxes
    return counts


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stats = {}
    print("Converting IP102 detection ...")
    stats.update(convert_ip102())
    print("Converting PlantDoc-OD ...")
    stats.update(convert_plantdoc_od())

    yaml = (
        f"path: {OUT_DIR.as_posix()}\n"
        "train: images/train\n"
        "val: images/val\n"
        "test: images/test\n"
        "names:\n"
        + "".join(f"  {k}: {v}\n" for k, v in NAMES.items())
    )
    (OUT_DIR / "data.yaml").write_text(yaml)
    (OUT_DIR / "stats.json").write_text(json.dumps(stats, indent=2))
    for k in sorted(stats):
        print(f"  {k:22s} {stats[k]}")
    print(f"data.yaml written to {OUT_DIR / 'data.yaml'}")


if __name__ == "__main__":
    main()
