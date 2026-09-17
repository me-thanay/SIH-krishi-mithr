"""Stage 1: YOLO detector that locates leaves and insect pests in a photo.

Trained by ml/train_detector.py on IP102 (pest boxes) + PlantDoc-OD (leaf boxes).

    from ml.region_detector import RegionDetector
    det = RegionDetector()                          # loads ml/models/leaf_pest_yolo.pt
    regions = det.detect(image_bytes_or_path)       # [{"type": "leaf"|"pest", "box": [x1,y1,x2,y2], ...}]
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from PIL import Image

from .leaf_classifier import ImageInput, to_pil

ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "models" / "leaf_pest_yolo.pt"


class RegionDetector:
    def __init__(self, weights: Path = MODEL_PATH, device: str | None = None, imgsz: int = 640):
        path = Path(weights)
        if not path.exists():
            fallback = ML_DIR / "runs" / "leaf_pest_det" / "weights" / "best.pt"
            if fallback.exists():
                path = fallback
        if not path.exists():
            raise FileNotFoundError(
                f"Detector weights not found at {weights}. Train with `python ml/train_detector.py`."
            )
        from ultralytics import YOLO  # lazy so the API can boot without ultralytics installed

        self.model = YOLO(str(path))
        self.imgsz = imgsz
        self.device = device
        self.names: dict[int, str] = {int(k): str(v) for k, v in self.model.names.items()}

    def detect(self, image: ImageInput, conf: float = 0.25, iou: float = 0.5, max_det: int = 30) -> list[dict[str, Any]]:
        img = to_pil(image)
        w, h = img.size
        results = self.model.predict(img, imgsz=self.imgsz, conf=conf, iou=iou, max_det=max_det,
                                     device=self.device, verbose=False)
        out: list[dict[str, Any]] = []
        if not results:
            return out
        boxes = results[0].boxes
        for xyxy, c, p in zip(boxes.xyxy.tolist(), boxes.cls.tolist(), boxes.conf.tolist()):
            x1, y1, x2, y2 = (int(round(v)) for v in xyxy)
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
            if x2 - x1 < 4 or y2 - y1 < 4:
                continue
            out.append({
                "type": self.names.get(int(c), str(int(c))),
                "confidence": round(float(p), 4),
                "box": [x1, y1, x2, y2],
                "box_norm": [round(x1 / w, 4), round(y1 / h, 4), round(x2 / w, 4), round(y2 / h, 4)],
                "area_fraction": round((x2 - x1) * (y2 - y1) / float(w * h), 4),
            })
        out.sort(key=lambda d: d["confidence"], reverse=True)
        return out


def crop_with_margin(img: Image.Image, box: list[int], margin: float = 0.08) -> Image.Image:
    """Crop `box` from `img` with a little context around it (classifiers were trained on full photos)."""
    w, h = img.size
    x1, y1, x2, y2 = box
    mx, my = (x2 - x1) * margin, (y2 - y1) * margin
    return img.crop((int(max(0, x1 - mx)), int(max(0, y1 - my)), int(min(w, x2 + mx)), int(min(h, y2 + my))))
