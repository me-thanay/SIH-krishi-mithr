"""Fine-tune a COCO-pretrained YOLO detector on the IP102 pest detection subset.

Usage (from repo root, after ml/prepare_ip102_det.py):
    python ml/train_ip102_yolo.py --model yolo11s.pt --epochs 25 --imgsz 640 --batch 16

Outputs:
    ml/runs/ip102/<name>/            Ultralytics run dir (weights/best.pt, results.csv, plots)
    ml/models/ip102_yolo.pt          best weights copied for inference
    ml/models/ip102_yolo_metrics.json  val + test mAP
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
DATA_YAML = ML_DIR / "datasets" / "ip102_yolo" / "ip102.yaml"
RUNS_DIR = ML_DIR / "runs" / "ip102"
MODEL_OUT = ML_DIR / "models" / "ip102_yolo.pt"
METRICS_OUT = ML_DIR / "models" / "ip102_yolo_metrics.json"


def summarize(metrics) -> dict:
    box = metrics.box
    return {
        "mAP50": float(box.map50),
        "mAP50-95": float(box.map),
        "precision": float(box.mp),
        "recall": float(box.mr),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="yolo11s.pt", help="pretrained checkpoint to fine-tune")
    parser.add_argument("--name", default="yolo11s")
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--patience", type=int, default=8)
    parser.add_argument("--lr0", type=float, default=0.01)
    parser.add_argument("--warmup-epochs", type=float, default=3.0)
    parser.add_argument("--close-mosaic", type=int, default=5)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--skip-train", action="store_true", help="only evaluate an existing run")
    args = parser.parse_args()

    from ultralytics import YOLO

    run_dir = RUNS_DIR / args.name
    best = run_dir / "weights" / "best.pt"

    if not args.skip_train:
        model = YOLO(str(run_dir / "weights" / "last.pt") if args.resume else args.model)
        model.train(
            data=str(DATA_YAML),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            workers=args.workers,
            patience=args.patience,
            lr0=args.lr0,
            cos_lr=True,
            warmup_epochs=args.warmup_epochs,
            close_mosaic=args.close_mosaic,
            amp=True,
            project=str(RUNS_DIR),
            name=args.name,
            exist_ok=True,
            resume=args.resume,
            seed=42,
            plots=True,
            verbose=True,
        )

    if not best.exists():
        raise SystemExit(f"No best.pt found in {run_dir}")

    model = YOLO(str(best))
    val_metrics = summarize(model.val(data=str(DATA_YAML), split="val", imgsz=args.imgsz, batch=args.batch,
                                      workers=args.workers, plots=False, verbose=False))
    test_metrics = summarize(model.val(data=str(DATA_YAML), split="test", imgsz=args.imgsz, batch=args.batch,
                                       workers=args.workers, plots=True, verbose=False,
                                       project=str(RUNS_DIR), name=f"{args.name}_test", exist_ok=True))

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(best, MODEL_OUT)
    METRICS_OUT.write_text(json.dumps(
        {"model": args.model, "imgsz": args.imgsz, "epochs": args.epochs, "val": val_metrics, "test": test_metrics},
        indent=2,
    ))
    print(f"\nVAL  {val_metrics}\nTEST {test_metrics}\nSaved weights to {MODEL_OUT}")


if __name__ == "__main__":
    main()
