"""Inference wrappers for the fine-tuned EfficientNetV2-S classifiers.

    from ml.leaf_classifier import LeafClassifier, PestClassifier
    LeafClassifier().predict(image)   # PlantDoc: plant + disease         (ml/models/plantdoc_efficientnet_v2_s.pt)
    PestClassifier().predict(image)   # IP102:    insect pest species     (ml/models/ip102_efficientnet_v2_s.pt)

`image` may be a path, raw bytes or a PIL image. Camera EXIF orientation is honoured.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Union

import torch
import torch.nn as nn
from PIL import Image, ImageOps
from torchvision import transforms
from torchvision.models import efficientnet_v2_s

from .plantdoc_common import MODEL_DIR, MODEL_PATH, describe_class

ImageInput = Union[str, Path, bytes, Image.Image]
PEST_MODEL_PATH = MODEL_DIR / "ip102_efficientnet_v2_s.pt"
DEFICIENCY_MODEL_PATH = MODEL_DIR / "maize_efficientnet_v2_s.pt"


def to_pil(image: ImageInput) -> Image.Image:
    if isinstance(image, Image.Image):
        img = image
    elif isinstance(image, (bytes, bytearray)):
        img = Image.open(io.BytesIO(image))
    else:
        img = Image.open(image)
    return ImageOps.exif_transpose(img).convert("RGB")


class EfficientNetClassifier:
    """Loads a checkpoint written by ml/train_classifier.py and returns ranked class predictions."""

    train_hint = "python ml/train_classifier.py"

    def __init__(self, checkpoint: Path, device: str | None = None):
        if not Path(checkpoint).exists():
            raise FileNotFoundError(f"Model checkpoint not found at {checkpoint}. Train it with `{self.train_hint}`.")
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        ckpt = torch.load(checkpoint, map_location="cpu", weights_only=False)

        self.tag: str = ckpt.get("tag", Path(checkpoint).stem)
        self.classes: list[str] = ckpt["classes"]
        self.img_size: int = ckpt["img_size"]
        self.class_info: list[dict[str, Any]] = []
        for info in ckpt["class_info"]:
            info = dict(info)
            if "name" not in info:  # checkpoints from before the generic trainer
                plant, disease = describe_class(info["folder"])
                info.update(plant=plant, disease=disease, name=f"{plant} - {disease}")
            self.class_info.append(info)

        model = efficientnet_v2_s(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(nn.Dropout(p=0.3, inplace=True), nn.Linear(in_features, len(self.classes)))
        state = {k: (v.float() if v.is_floating_point() else v) for k, v in ckpt["model_state"].items()}
        model.load_state_dict(state)
        self.model = model.to(self.device).eval()

        self.transform = transforms.Compose(
            [
                transforms.Resize(int(self.img_size * 1.14)),
                transforms.CenterCrop(self.img_size),
                transforms.ToTensor(),
                transforms.Normalize(tuple(ckpt["mean"]), tuple(ckpt["std"])),
            ]
        )

    @torch.no_grad()
    def rank(self, image: ImageInput, top_k: int = 3, tta: bool = True) -> list[dict[str, Any]]:
        x = self.transform(to_pil(image)).unsqueeze(0).to(self.device)
        logits = self.model(x)
        if tta:  # horizontal-flip TTA: cheap and stabilises hand-held camera shots
            logits = (logits + self.model(torch.flip(x, dims=[3]))) / 2
        probs = torch.softmax(logits.float(), dim=1)[0]
        conf, idx = probs.topk(min(top_k, len(self.classes)))
        out = []
        for p, i in zip(conf.tolist(), idx.tolist()):
            info = self.class_info[i]
            out.append({**{k: info.get(k) for k in ("name", "plant", "disease")},
                        "label": info["folder"], "confidence": round(p, 4)})
        return out


class LeafClassifier(EfficientNetClassifier):
    """PlantDoc leaf disease classifier: plant + disease (or Healthy)."""

    train_hint = "python ml/train_plantdoc.py"

    def __init__(self, checkpoint: Path = MODEL_PATH, device: str | None = None):
        super().__init__(checkpoint, device)

    def predict(self, image: ImageInput, top_k: int = 3, tta: bool = True) -> dict[str, Any]:
        top = [{**t, "healthy": (t["disease"] or "").lower() == "healthy"} for t in self.rank(image, top_k, tta)]
        best = top[0]
        return {
            "plant": best["plant"],
            "disease": best["disease"],
            "healthy": best["healthy"],
            "confidence": best["confidence"],
            "label": best["label"],
            "top_k": top,
            "model": "efficientnet_v2_s-plantdoc",
        }


class PestClassifier(EfficientNetClassifier):
    """IP102 insect pest species classifier (102 classes)."""

    train_hint = "python ml/train_classifier.py --data ml/datasets/ip102_cls_cache --tag ip102"

    def __init__(self, checkpoint: Path = PEST_MODEL_PATH, device: str | None = None):
        super().__init__(checkpoint, device)

    def predict(self, image: ImageInput, top_k: int = 3, tta: bool = True) -> dict[str, Any]:
        top = [{"species": t["name"], "label": t["label"], "confidence": t["confidence"]} for t in self.rank(image, top_k, tta)]
        best = top[0]
        return {
            "species": best["species"],
            "confidence": best["confidence"],
            "label": best["label"],
            "top_k": top,
            "model": "efficientnet_v2_s-ip102",
        }


class DeficiencyClassifier(EfficientNetClassifier):
    """Maize nutrient-deficiency classifier (crop-specific labels)."""

    train_hint = (
        "python ml/prepare_maize_deficiency.py && "
        "python ml/train_classifier.py --data ml/datasets/maize_def_cache --tag maize"
    )
    crop = "Maize"

    def __init__(self, checkpoint: Path = DEFICIENCY_MODEL_PATH, device: str | None = None):
        super().__init__(checkpoint, device)

    def predict(self, image: ImageInput, top_k: int = 3, tta: bool = True) -> dict[str, Any]:
        top = []
        for t in self.rank(image, top_k, tta):
            label = t.get("name") or t["label"]
            healthy = t["label"].lower() == "healthy" or (label or "").lower() in {"none", "healthy"}
            top.append({
                "suspected_deficiency": None if healthy else label,
                "healthy": healthy,
                "label": t["label"],
                "confidence": t["confidence"],
            })
        best = top[0]
        return {
            "crop": self.crop,
            "suspected_deficiency": best["suspected_deficiency"],
            "healthy": best["healthy"],
            "confidence": best["confidence"],
            "label": best["label"],
            "top_k": top,
            "model": "efficientnet_v2_s-maize-deficiency",
        }
