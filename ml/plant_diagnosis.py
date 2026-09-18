"""Camera vision pipeline: YOLO locates, EfficientNet classifies.

Stage 1  YOLO (`leaf` / `pest`) finds boxes in the phone or ESP32-CAM frame.
Stage 2  Each leaf crop  -> EfficientNetV2-S PlantDoc (plant + disease)
         Maize leaves    -> EfficientNetV2-S deficiency head when plant is corn/maize
         Each pest crop  -> EfficientNet IP102 if trained, else IP102 YOLO species
This path is camera-only (no sensors / XGBoost).
"""

from __future__ import annotations

import base64
import io
import os
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from .leaf_classifier import DeficiencyClassifier, LeafClassifier, PestClassifier, to_pil
from .leaf_locator import locate_leaf
from .region_detector import RegionDetector, crop_with_margin

MAX_LEAVES = 3            # diagnose at most this many leaf regions (largest first)
MAX_PESTS = 6
DISEASE_CONF_FINDING = 0.45
PEST_CONF_FINDING = 0.40
DEFICIENCY_CONF_FINDING = 0.45
MAIZE_PLANTS = {"corn", "maize"}
MIN_LEAF_AREA = 0.03      # leaf boxes smaller than this fraction of the frame are too small to diagnose

GREEN, RED, GREY, AMBER, BLUE = (46, 160, 67), (220, 38, 38), (120, 120, 120), (217, 119, 6), (37, 99, 235)


def _load(factory):
    try:
        return factory(), None
    except Exception as exc:  # missing weights / dependency
        return None, f"{type(exc).__name__}: {exc}"


def _light_mode() -> bool:
    """Render CPU instances OOM if we load 2 YOLOs + 2 EfficientNets at once."""
    return os.getenv("DIAGNOSE_LIGHT", "1").strip().lower() not in {"0", "false", "no"}


class PlantDiagnosisPipeline:
    def __init__(self, detector: RegionDetector | None = None, leaf_classifier: LeafClassifier | None = None,
                 pest_classifier: PestClassifier | None = None, pest_detector=None):
        # Eager: only the camera core path (YOLO leaf/pest boxes + PlantDoc EfficientNet).
        self.detector, self.detector_error = (detector, None) if detector else _load(RegionDetector)
        self.leaf_clf, self.leaf_clf_error = (leaf_classifier, None) if leaf_classifier else _load(LeafClassifier)

        # Lazy / optional extras — second YOLO (IP102) is the usual OOM trigger on 2 GB Render.
        self._pest_clf = pest_classifier if pest_classifier is not None else None
        self._pest_clf_loaded = pest_classifier is not None
        self.pest_clf_error = None

        self._pest_det = pest_detector
        self._pest_det_loaded = pest_detector is not None
        self.pest_det_error = None

        self._def_clf = None
        self._def_clf_loaded = False
        self.def_clf_error = None

        if self.detector is None and self.leaf_clf is None:
            raise RuntimeError(
                f"No models available. detector: {self.detector_error}; leaf classifier: {self.leaf_clf_error}"
            )

    @property
    def pest_clf(self):
        if self._pest_clf_loaded:
            return self._pest_clf
        self._pest_clf_loaded = True
        if _light_mode():
            self.pest_clf_error = "skipped (DIAGNOSE_LIGHT=1)"
            self._pest_clf = None
            return None
        self._pest_clf, self.pest_clf_error = _load(PestClassifier)
        return self._pest_clf

    @property
    def pest_det(self):
        if self._pest_det_loaded:
            return self._pest_det
        self._pest_det_loaded = True
        # Never load a second YOLO unless explicitly enabled — keeps Diagnose under ~2 GB RAM.
        if _light_mode() or os.getenv("ENABLE_IP102_YOLO", "0").strip().lower() not in {"1", "true", "yes"}:
            self.pest_det_error = "skipped (light mode / ENABLE_IP102_YOLO!=1)"
            self._pest_det = None
            return None
        from .pest_detector import PestDetector
        self._pest_det, self.pest_det_error = _load(PestDetector)
        return self._pest_det

    @property
    def def_clf(self):
        if self._def_clf_loaded:
            return self._def_clf
        self._def_clf_loaded = True
        self._def_clf, self.def_clf_error = _load(DeficiencyClassifier)
        return self._def_clf

    # ------------------------------------------------------------------ drawing

    @staticmethod
    def _annotate(img: Image.Image, leaves: list[dict], pests: list[dict], fallback: dict | None) -> str:
        canvas = img.copy()
        draw = ImageDraw.Draw(canvas)
        stroke = max(2, int(min(canvas.size) / 200))
        try:
            font = ImageFont.truetype("arial.ttf", max(14, int(min(canvas.size) / 40)))
        except OSError:
            font = ImageFont.load_default()

        def label(xy, text, colour):
            x, y = xy
            tw, th = draw.textbbox((0, 0), text, font=font)[2:]
            y = max(0, y - th - 4)
            draw.rectangle([x, y, x + tw + 6, y + th + 4], fill=colour)
            draw.text((x + 3, y + 2), text, fill="white", font=font)

        for leaf in leaves:
            d = leaf.get("diagnosis")
            defn = leaf.get("deficiency")
            colour = BLUE if (defn and defn.get("suspected_deficiency")) else (
                GREEN if (d and d["healthy"]) else (AMBER if d else GREY)
            )
            draw.rectangle(leaf["box"], outline=colour, width=stroke)
            if defn and defn.get("suspected_deficiency"):
                text = f"Maize: {defn['suspected_deficiency']} {defn['confidence']:.0%}"
            elif not d:
                text = "leaf"
            else:
                text = f"{d['plant']}: {d['disease']} {d['confidence']:.0%}"
            label((leaf["box"][0], leaf["box"][1]), text, colour)
        for pest in pests:
            draw.rectangle(pest["box"], outline=RED, width=stroke)
            name = pest.get("species") or "pest"
            label((pest["box"][0], pest["box"][1]), f"{name} {pest['confidence']:.0%}", RED)
        if fallback and fallback.get("box"):
            draw.rectangle(fallback["box"], outline=GREY, width=stroke)
            label((fallback["box"][0], fallback["box"][1]), f"leaf (colour fallback)", GREY)
        if not leaves and not pests and not (fallback and fallback.get("box")):
            label((4, 24), "no leaf or pest located", GREY)

        buf = io.BytesIO()
        canvas.save(buf, "JPEG", quality=85)
        return base64.b64encode(buf.getvalue()).decode("ascii")

    # ------------------------------------------------------------------ main

    def diagnose(self, image, det_conf: float = 0.25, top_k: int = 3, annotate: bool = False) -> dict[str, Any]:
        img = to_pil(image)
        w, h = img.size

        # Stage 1: locate.
        regions: list[dict] = self.detector.detect(img, conf=det_conf) if self.detector else []
        leaf_regions = sorted((r for r in regions if r["type"] == "leaf"), key=lambda r: -r["area_fraction"])
        pest_regions = [r for r in regions if r["type"] == "pest"]

        # Stage 2a: diagnose each leaf crop.
        leaves: list[dict] = []
        for r in leaf_regions[:MAX_LEAVES]:
            entry = {
                "box": r["box"],
                "det_confidence": r["confidence"],
                "area_fraction": r["area_fraction"],
                "too_small": r["area_fraction"] < MIN_LEAF_AREA,
                "diagnosis": None,
                "deficiency": None,
                "located_by": "yolo",
                "classified_by": None,
            }
            crop = crop_with_margin(img, r["box"])
            if self.leaf_clf and not entry["too_small"]:
                entry["diagnosis"] = self.leaf_clf.predict(crop, top_k=top_k)
                entry["classified_by"] = "efficientnet_v2_s-plantdoc"
            if not entry["too_small"]:
                plant = ((entry["diagnosis"] or {}).get("plant") or "").lower()
                if plant in MAIZE_PLANTS and self.def_clf:
                    entry["deficiency"] = self.def_clf.predict(crop, top_k=top_k)
                    entry["deficiency_by"] = "efficientnet_v2_s-maize-deficiency"
            leaves.append(entry)

        # Stage 2b: identify each pest crop.
        pests: list[dict] = []
        for r in pest_regions[:MAX_PESTS]:
            entry = {
                "box": r["box"],
                "det_confidence": r["confidence"],
                "area_fraction": r["area_fraction"],
                "species": None,
                "confidence": r["confidence"],
                "top_k": [],
                "located_by": "yolo",
                "classified_by": None,
            }
            if self.pest_clf:
                sp = self.pest_clf.predict(crop_with_margin(img, r["box"], margin=0.15), top_k=top_k)
                entry.update(
                    species=sp["species"],
                    confidence=round(r["confidence"] * sp["confidence"], 4),
                    species_confidence=sp["confidence"],
                    top_k=sp["top_k"],
                    classified_by="efficientnet_v2_s-ip102",
                )
            elif self.pest_det:
                hits = self.pest_det.detect(crop_with_margin(img, r["box"], margin=0.15), conf=max(0.12, det_conf * 0.5))
                if hits:
                    best = hits[0]
                    entry.update(
                        species=best["pest"],
                        confidence=round(r["confidence"] * best["confidence"], 4),
                        species_confidence=best["confidence"],
                        top_k=[{"species": h["pest"], "label": h["pest"], "confidence": h["confidence"]} for h in hits[:top_k]],
                        classified_by="yolo11s-ip102",
                    )
            pests.append(entry)

        # Fallback: no leaf located by YOLO -> colour locator -> whole frame (unreliable).
        fallback: dict | None = None
        if not leaves and self.leaf_clf:
            located = locate_leaf(img)
            region = img.crop(located["box"]) if located else img
            fallback = {
                "box": located["box"] if located else None,
                "source": "colour_locator" if located else "full_image",
                "diagnosis": self.leaf_clf.predict(region, top_k=top_k),
                "reliable": False,
            }

        # Findings.
        findings: list[dict] = []
        for leaf in leaves:
            d = leaf["diagnosis"]
            if d and not d["healthy"] and d["confidence"] >= DISEASE_CONF_FINDING:
                findings.append({"type": "disease", "name": f"{d['plant']} - {d['disease']}",
                                 "confidence": d["confidence"], "box": leaf["box"]})
            defn = leaf.get("deficiency")
            if defn and defn.get("suspected_deficiency") and defn["confidence"] >= DEFICIENCY_CONF_FINDING:
                findings.append({"type": "deficiency", "name": f"{defn['crop']} - {defn['suspected_deficiency']}",
                                 "confidence": defn["confidence"], "box": leaf["box"],
                                 "suspected_deficiency": defn["suspected_deficiency"]})
        for pest in pests:
            if pest["confidence"] >= PEST_CONF_FINDING or (pest["species"] is None and pest["det_confidence"] >= 0.5):
                findings.append({"type": "pest", "name": pest["species"] or "insect pest",
                                 "confidence": pest["confidence"], "box": pest["box"]})
        findings.sort(key=lambda f: -f["confidence"])

        healthy_leaves = [l for l in leaves if l["diagnosis"] and l["diagnosis"]["healthy"]
                          and l["diagnosis"]["confidence"] >= DISEASE_CONF_FINDING]
        if findings:
            summary = "; ".join(f"{f['name']} ({f['confidence']:.0%})" for f in findings)
        elif healthy_leaves:
            d = healthy_leaves[0]["diagnosis"]
            summary = f"{d['plant']} leaf looks healthy ({d['confidence']:.0%}); no pests located"
        elif leaves and all(l["too_small"] for l in leaves):
            summary = "Leaf is too small in the frame; move closer so one leaf fills most of the photo"
        elif fallback:
            d = fallback["diagnosis"]
            summary = (f"No leaf located by the detector; whole-image guess {d['plant']} - {d['disease']} "
                       f"({d['confidence']:.0%}) is unreliable. Retake with one leaf filling the frame")
        else:
            summary = "No confident disease or pest finding; retake with one leaf filling the frame in daylight"

        report: dict[str, Any] = {
            "image_size": [w, h],
            "regions": regions,
            "leaves": leaves,
            "pests": pests,
            "fallback": fallback,
            "findings": findings,
            "summary": summary,
            "pipeline": {
                "mode": "camera_vision",
                "description": "YOLO locates leaves/pests; EfficientNetV2-S classifies each leaf crop (disease / maize deficiency).",
                "stages": [
                    {
                        "id": "yolo_locate",
                        "name": "YOLO locate",
                        "role": "Find leaf and pest boxes in the camera frame",
                        "model": "yolo11s-leaf-pest" if self.detector else None,
                        "leaf_boxes": len(leaf_regions),
                        "pest_boxes": len(pest_regions),
                    },
                    {
                        "id": "efficientnet_classify",
                        "name": "EfficientNet classify",
                        "role": "Name plant disease (and maize deficiency) on each YOLO leaf crop",
                        "model": "efficientnet_v2_s-plantdoc" if self.leaf_clf else None,
                        "deficiency_model": (
                            "efficientnet_v2_s-maize-deficiency"
                            if self._def_clf_loaded and self._def_clf
                            else None
                        ),
                        "leaves_classified": sum(1 for leaf in leaves if leaf.get("diagnosis")),
                        "deficiencies_classified": sum(
                            1 for leaf in leaves if leaf.get("deficiency") and leaf["deficiency"].get("suspected_deficiency")
                        ),
                    },
                    {
                        "id": "pest_identify",
                        "name": "Pest identify",
                        "role": "Name insect species on each YOLO pest crop",
                        "model": (
                            "efficientnet_v2_s-ip102" if self._pest_clf_loaded and self._pest_clf
                            else ("yolo11s-ip102" if self._pest_det_loaded and self._pest_det else None)
                        ),
                        "pests_identified": sum(1 for pest in pests if pest.get("species")),
                    },
                ],
            },
            "models": {
                "detector": "yolo11s-leaf-pest" if self.detector else None,
                "leaf_classifier": "efficientnet_v2_s-plantdoc" if self.leaf_clf else None,
                "deficiency_classifier": (
                    "efficientnet_v2_s-maize-deficiency"
                    if self._def_clf_loaded and self._def_clf
                    else None
                ),
                "pest_classifier": (
                    "efficientnet_v2_s-ip102" if self._pest_clf_loaded and self._pest_clf
                    else ("yolo11s-ip102" if self._pest_det_loaded and self._pest_det else None)
                ),
                "errors": {k: v for k, v in (
                    ("detector", self.detector_error),
                    ("leaf_classifier", self.leaf_clf_error),
                    ("pest_classifier", self.pest_clf_error),
                    ("pest_detector", self.pest_det_error),
                    ("deficiency_classifier", self.def_clf_error),
                ) if v},
            },
        }
        if annotate:
            report["annotated_image"] = self._annotate(img, leaves, pests, fallback)
        return report
