"""Train the YOLO leaf / pest localiser (stage 1 of the diagnosis pipeline).

Usage (from repo root, after ml/prepare_detection.py):
    python ml/train_detector.py --model yolo11s.pt --epochs 20

Outputs
    ml/runs/leaf_pest_det/           Ultralytics run dir (weights, curves, confusion matrix)
    ml/models/leaf_pest_yolo.pt      best checkpoint copied for inference
    ml/models/leaf_pest_yolo_metrics.json
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
DATA_YAML = ML_DIR / "datasets" / "yolo_leaf_pest" / "data.yaml"
RUNS_DIR = ML_DIR / "runs"
MODEL_OUT = ML_DIR / "models" / "leaf_pest_yolo.pt"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="yolo11s.pt", help="pretrained COCO checkpoint to fine-tune")
    parser.add_argument("--data", type=Path, default=DATA_YAML)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--patience", type=int, default=6)
    parser.add_argument("--name", default="leaf_pest_det")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    from ultralytics import YOLO

    if args.resume:
        model = YOLO(RUNS_DIR / args.name / "weights" / "last.pt")
        model.train(resume=True)
    else:
        model = YOLO(args.model)
        model.train(
            data=str(args.data),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            workers=args.workers,
            patience=args.patience,
            project=str(RUNS_DIR),
            name=args.name,
            exist_ok=True,
            cos_lr=True,
            close_mosaic=5,
            pretrained=True,
            plots=True,
            seed=42,
        )

    best = RUNS_DIR / args.name / "weights" / "best.pt"
    model = YOLO(best)
    results = model.val(data=str(args.data), split="test", imgsz=args.imgsz, batch=args.batch,
                        workers=args.workers, project=str(RUNS_DIR), name=f"{args.name}_test", exist_ok=True, plots=True)

    names = results.names
    per_class = {
        names[int(i)]: {"AP50": float(results.box.ap50[k]), "AP50-95": float(results.box.ap[k])}
        for k, i in enumerate(results.box.ap_class_index)
    }
    metrics = {
        "model": args.model,
        "imgsz": args.imgsz,
        "epochs": args.epochs,
        "test": {
            "mAP50": float(results.box.map50),
            "mAP50-95": float(results.box.map),
            "precision": float(results.box.mp),
            "recall": float(results.box.mr),
            "per_class": per_class,
        },
    }
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(best, MODEL_OUT)
    MODEL_OUT.with_name("leaf_pest_yolo_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))
    print(f"Saved detector to {MODEL_OUT}")


if __name__ == "__main__":
    main()
