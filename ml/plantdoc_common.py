"""Shared helpers for the PlantDoc leaf-disease classifier."""

from __future__ import annotations

import re
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
DATASET_DIR = ML_DIR / "datasets" / "plantdoc"
CACHE_DIR = ML_DIR / "datasets" / "plantdoc_cache"
MODEL_DIR = ML_DIR / "models"
MODEL_PATH = MODEL_DIR / "plantdoc_efficientnet_v2_s.pt"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ImageNet normalisation used by the pretrained EfficientNetV2-S weights.
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Human-readable (plant, disease) for every PlantDoc folder name.
# "Healthy" means the folder holds leaves without a disease.
CLASS_INFO: dict[str, tuple[str, str]] = {
    "Apple Scab Leaf": ("Apple", "Apple scab"),
    "Apple leaf": ("Apple", "Healthy"),
    "Apple rust leaf": ("Apple", "Cedar apple rust"),
    "Bell_pepper leaf": ("Bell pepper", "Healthy"),
    "Bell_pepper leaf spot": ("Bell pepper", "Bacterial leaf spot"),
    "Blueberry leaf": ("Blueberry", "Healthy"),
    "Cherry leaf": ("Cherry", "Healthy"),
    "Corn Gray leaf spot": ("Corn", "Gray leaf spot"),
    "Corn leaf blight": ("Corn", "Northern leaf blight"),
    "Corn rust leaf": ("Corn", "Common rust"),
    "Peach leaf": ("Peach", "Healthy"),
    "Potato leaf": ("Potato", "Healthy"),
    "Potato leaf early blight": ("Potato", "Early blight"),
    "Potato leaf late blight": ("Potato", "Late blight"),
    "Raspberry leaf": ("Raspberry", "Healthy"),
    "Soyabean leaf": ("Soybean", "Healthy"),
    "Soybean leaf": ("Soybean", "Healthy"),
    "Squash Powdery mildew leaf": ("Squash", "Powdery mildew"),
    "Strawberry leaf": ("Strawberry", "Healthy"),
    "Tomato Early blight leaf": ("Tomato", "Early blight"),
    "Tomato Septoria leaf spot": ("Tomato", "Septoria leaf spot"),
    "Tomato leaf": ("Tomato", "Healthy"),
    "Tomato leaf bacterial spot": ("Tomato", "Bacterial spot"),
    "Tomato leaf late blight": ("Tomato", "Late blight"),
    "Tomato leaf mosaic virus": ("Tomato", "Mosaic virus"),
    "Tomato leaf yellow virus": ("Tomato", "Yellow leaf curl virus"),
    "Tomato mold leaf": ("Tomato", "Leaf mold"),
    "Tomato two spotted spider mites leaf": ("Tomato", "Two-spotted spider mites"),
    "grape leaf": ("Grape", "Healthy"),
    "grape leaf black rot": ("Grape", "Black rot"),
}


def describe_class(folder_name: str) -> tuple[str, str]:
    """Return (plant, disease) for a PlantDoc folder, with a heuristic fallback."""
    if folder_name in CLASS_INFO:
        return CLASS_INFO[folder_name]

    words = folder_name.replace("_", " ").split()
    plant = words[0].capitalize() if words else "Unknown"
    rest = [w for w in words[1:]]
    if rest and rest[0].lower() == "leaf" and len(rest) > 2:
        rest = rest[1:]
    if rest and rest[-1].lower() == "leaf":
        rest = rest[:-1]
    disease = " ".join(rest).strip()
    disease = re.sub(r"\s+", " ", disease)
    return plant, (disease.capitalize() if disease else "Healthy")


def list_images(folder: Path) -> list[Path]:
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)
