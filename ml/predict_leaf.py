"""Classify a leaf photo with the trained PlantDoc model.

Usage (from repo root):
    python ml/predict_leaf.py path/to/leaf.jpg [more.jpg ...] [--top-k 3]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ml.leaf_classifier import LeafClassifier  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("images", nargs="+", type=Path)
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--no-tta", action="store_true")
    args = parser.parse_args()

    clf = LeafClassifier()
    for path in args.images:
        result = clf.predict(path, top_k=args.top_k, tta=not args.no_tta)
        print(f"\n{path}")
        print(f"  {result['plant']} - {result['disease']}  ({result['confidence']:.1%})")
        for alt in result["top_k"][1:]:
            print(f"    alt: {alt['plant']} - {alt['disease']}  ({alt['confidence']:.1%})")
        if len(args.images) == 1:
            print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
