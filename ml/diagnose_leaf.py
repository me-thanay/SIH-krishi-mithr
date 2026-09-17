"""Run the full locate-then-diagnose pipeline on photos.

Usage (from repo root):
    python ml/diagnose_leaf.py photo.jpg [more.jpg ...] [--save-dir out/] [--det-conf 0.25]
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ml.plant_diagnosis import PlantDiagnosisPipeline  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("images", nargs="+", type=Path)
    parser.add_argument("--save-dir", type=Path, help="write annotated JPEGs here")
    parser.add_argument("--det-conf", type=float, default=0.25)
    parser.add_argument("--json", action="store_true", help="print the full report")
    args = parser.parse_args()

    pipe = PlantDiagnosisPipeline()
    for path in args.images:
        report = pipe.diagnose(path, det_conf=args.det_conf, annotate=bool(args.save_dir))
        print(f"\n{path.name}: {report['summary']}")
        for leaf in report["leaves"]:
            d = leaf["diagnosis"]
            text = f"{d['plant']} - {d['disease']} {d['confidence']:.0%}" if d else ("too small" if leaf["too_small"] else "-")
            print(f"  leaf  det {leaf['det_confidence']:.0%} box={leaf['box']}  ->  {text}")
        for pest in report["pests"]:
            print(f"  pest  det {pest['det_confidence']:.0%} box={pest['box']}  ->  {pest['species'] or '?'} {pest['confidence']:.0%}")
        if report["fallback"]:
            d = report["fallback"]["diagnosis"]
            print(f"  fallback ({report['fallback']['source']}): {d['plant']} - {d['disease']} {d['confidence']:.0%}")
        if args.save_dir:
            args.save_dir.mkdir(parents=True, exist_ok=True)
            out = args.save_dir / f"{path.stem}_diagnosed.jpg"
            out.write_bytes(base64.b64decode(report.pop("annotated_image")))
            print(f"  saved {out}")
        if args.json:
            report.pop("annotated_image", None)
            print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
