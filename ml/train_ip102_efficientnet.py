"""Fine-tune EfficientNetV2-S on IP102 pest species (camera stage-2 after YOLO).

YOLO leaf/pest detector finds insect boxes; this classifier names the species.

Usage (repo root):
    python -u ml/train_ip102_efficientnet.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
ROOT = ML_DIR.parent


def main() -> None:
    cmd = [
        sys.executable,
        "-u",
        str(ML_DIR / "train_classifier.py"),
        "--data",
        str(ML_DIR / "datasets" / "ip102_cls_cache"),
        "--tag",
        "ip102",
        "--class-names",
        str(ML_DIR / "datasets" / "ip102_cls_cache" / "classes.json"),
        "--img-size",
        "224",
        "--eval-size",
        "256",
        "--batch-size",
        "8",
        "--epochs",
        "12",
        "--head-epochs",
        "2",
        "--workers",
        "4",
        "--patience",
        "5",
        "--mixup",
        "0.1",
        "--weight-decay",
        "0.02",
        "--stochastic-depth",
        "0.2",
    ]
    raise SystemExit(subprocess.call(cmd, cwd=str(ROOT)))


if __name__ == "__main__":
    main()
