"""Fine-tune EfficientNetV2-S on PlantDoc (leaf disease). Thin wrapper over train_classifier.py.

Usage (from repo root):
    python ml/prepare_plantdoc.py
    python ml/train_plantdoc.py --epochs 40 --mixup 0.2 --cutmix 1.0 --stochastic-depth 0.3 --weight-decay 0.02
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from plantdoc_common import CACHE_DIR  # noqa: E402
from train_classifier import main  # noqa: E402

if __name__ == "__main__":
    if "--data" not in sys.argv:
        sys.argv += ["--data", str(CACHE_DIR)]
    if "--tag" not in sys.argv:
        sys.argv += ["--tag", "plantdoc"]
    main()
