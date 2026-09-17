"""YOLO pest detector fine-tuned on IP102 (102 insect pest classes).

    from ml.pest_detector import PestDetector
    det = PestDetector()                      # loads ml/models/ip102_yolo.pt
    boxes = det.detect(image_bytes_or_path)   # list of dicts with pest / confidence / box
"""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any, Union

from PIL import Image, ImageOps

from .device import inference_device

ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "models" / "ip102_yolo.pt"
CLASSES_PATH = ML_DIR / "ip102_classes.json"

ImageInput = Union[str, Path, bytes, Image.Image]


def to_pil(image: ImageInput) -> Image.Image:
    if isinstance(image, Image.Image):
        img = image
    elif isinstance(image, (bytes, bytearray)):
        img = Image.open(io.BytesIO(image))
    else:
        img = Image.open(image)
    return ImageOps.exif_transpose(img).convert("RGB")


class PestDetector:
    def __init__(self, weights: Path = MODEL_PATH, device: str | None = None, imgsz: int = 640):
        if not Path(weights).exists():
            raise FileNotFoundError(
                f"Pest detector weights not found at {weights}. Train with `python ml/train_ip102_yolo.py`."
            )
        from ultralytics import YOLO  # imported lazily so the API can boot without it

        self.model = YOLO(str(weights))
        self.imgsz = imgsz
        self.device = inference_device(device)
        names = self.model.names
        if CLASSES_PATH.exists():
            classes = json.loads(CLASSES_PATH.read_text())
            names = {i: n for i, n in enumerate(classes)}
        self.names: dict[int, str] = {int(k): str(v) for k, v in names.items()}

    def detect(self, image: ImageInput, conf: float = 0.25, iou: float = 0.5, max_det: int = 20) -> list[dict[str, Any]]:
        img = to_pil(image)
        w, h = img.size
        results = self.model.predict(
            img, imgsz=self.imgsz, conf=conf, iou=iou, max_det=max_det, device=self.device, verbose=False
        )
        out: list[dict[str, Any]] = []
        if not results:
            return out
        boxes = results[0].boxes
        for xyxy, c, p in zip(boxes.xyxy.tolist(), boxes.cls.tolist(), boxes.conf.tolist()):
            x1, y1, x2, y2 = (int(round(v)) for v in xyxy)
            out.append(
                {
                    "pest": self.names.get(int(c), str(int(c))),
                    "class_id": int(c),
                    "confidence": round(float(p), 4),
                    "box": [x1, y1, x2, y2],
                    "box_norm": [round(x1 / w, 4), round(y1 / h, 4), round(x2 / w, 4), round(y2 / h, 4)],
                    "area_fraction": round(((x2 - x1) * (y2 - y1)) / float(w * h), 4),
                }
            )
        out.sort(key=lambda d: d["confidence"], reverse=True)
        return out
