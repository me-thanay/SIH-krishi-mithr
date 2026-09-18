"""Camera vision pipeline: locate leaf, then EfficientNet disease classify.

Render (≤2 GB) cannot keep YOLO + EfficientNet in one process. YOLO runs in a
child process (OOM kills the child, not the API), then EfficientNet runs in-process.
"""

from __future__ import annotations

import base64
import gc
import io
import os
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from .leaf_classifier import DeficiencyClassifier, LeafClassifier, to_pil
from .leaf_locator import locate_leaf
from .region_detector import crop_with_margin

MAX_LEAVES = 2
MAX_PESTS = 4
DISEASE_CONF_FINDING = 0.45
PEST_CONF_FINDING = 0.40
DEFICIENCY_CONF_FINDING = 0.45
MAIZE_PLANTS = {"corn", "maize"}
MIN_LEAF_AREA = 0.03

GREEN, RED, GREY, AMBER, BLUE = (46, 160, 67), (220, 38, 38), (120, 120, 120), (217, 119, 6), (37, 99, 235)


def _load(factory):
    try:
        return factory(), None
    except Exception as exc:
        return None, f"{type(exc).__name__}: {exc}"


def _skip_yolo() -> bool:
    return os.getenv("DIAGNOSE_SKIP_YOLO", "0").strip().lower() in {"1", "true", "yes"}


def _free(*objs) -> None:
    for obj in objs:
        try:
            del obj
        except Exception:
            pass
    gc.collect()


def _yolo_worker(image_path: str, det_conf: float, out: Queue) -> None:
    """Child process: load YOLO, detect, put results, exit (frees RAM)."""
    try:
        from ml.region_detector import RegionDetector

        det = RegionDetector()
        regions = det.detect(image_path, conf=det_conf)
        out.put({"ok": True, "regions": regions})
    except Exception as exc:  # noqa: BLE001
        out.put({"ok": False, "error": f"{type(exc).__name__}: {exc}"})


def _detect_yolo_subprocess(img: Image.Image, det_conf: float) -> tuple[list[dict], str | None]:
    """Run YOLO in a subprocess so an OOM cannot kill the API worker."""
    from multiprocessing import get_context

    fd, path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    try:
        img.save(path, format="JPEG", quality=85)
        ctx = get_context("spawn")
        queue = ctx.Queue(1)
        proc = ctx.Process(target=_yolo_worker, args=(path, det_conf, queue), daemon=True)
        proc.start()
        proc.join(timeout=float(os.getenv("YOLO_SUBPROCESS_TIMEOUT", "75")))
        if proc.is_alive():
            proc.terminate()
            proc.join(5)
            return [], "YOLO timed out in subprocess"
        if queue.empty():
            return [], "YOLO subprocess exited with no result (often OOM)"
        payload = queue.get_nowait()
        if not payload.get("ok"):
            return [], payload.get("error") or "YOLO failed"
        return payload.get("regions") or [], None
    finally:
        try:
            Path(path).unlink(missing_ok=True)
        except Exception:
            pass


class PlantDiagnosisPipeline:
    def __init__(self, detector=None, leaf_classifier=None, pest_classifier=None, pest_detector=None):
        self._inject_leaf = leaf_classifier
        self.detector_error = None
        self.leaf_clf_error = None
        self.def_clf_error = None

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
            label((fallback["box"][0], fallback["box"][1]), "leaf (colour fallback)", GREY)
        if not leaves and not pests and not (fallback and fallback.get("box")):
            label((4, 24), "no leaf or pest located", GREY)

        buf = io.BytesIO()
        canvas.save(buf, "JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode("ascii")

    def diagnose(self, image, det_conf: float = 0.25, top_k: int = 3, annotate: bool = False) -> dict[str, Any]:
        img = to_pil(image)
        max_side = int(os.getenv("DIAGNOSE_MAX_SIDE", "1024"))
        w0, h0 = img.size
        if max(w0, h0) > max_side:
            scale = max_side / float(max(w0, h0))
            img = img.resize((max(1, int(w0 * scale)), max(1, int(h0 * scale))))
        w, h = img.size

        regions: list[dict] = []
        if _skip_yolo():
            self.detector_error = "skipped (DIAGNOSE_SKIP_YOLO=1)"
        else:
            regions, self.detector_error = _detect_yolo_subprocess(img, det_conf)

        leaf_regions = sorted((r for r in regions if r.get("type") == "leaf"), key=lambda r: -r.get("area_fraction", 0))
        pest_regions = [r for r in regions if r.get("type") == "pest"]

        if not leaf_regions:
            located = locate_leaf(img)
            if located:
                leaf_regions = [{
                    "type": "leaf",
                    "confidence": 0.55,
                    "box": located["box"],
                    "area_fraction": located["coverage"],
                    "located_by": "colour_locator",
                }]

        leaf_clf = self._inject_leaf
        if leaf_clf is None:
            leaf_clf, self.leaf_clf_error = _load(LeafClassifier)
        if leaf_clf is None:
            raise RuntimeError(
                f"Leaf classifier unavailable. {self.leaf_clf_error}; detector: {self.detector_error}"
            )

        leaves: list[dict] = []
        for r in leaf_regions[:MAX_LEAVES]:
            entry = {
                "box": r["box"],
                "det_confidence": r["confidence"],
                "area_fraction": r["area_fraction"],
                "too_small": r["area_fraction"] < MIN_LEAF_AREA,
                "diagnosis": None,
                "deficiency": None,
                "located_by": r.get("located_by", "yolo"),
                "classified_by": None,
            }
            crop = crop_with_margin(img, r["box"])
            if not entry["too_small"]:
                entry["diagnosis"] = leaf_clf.predict(crop, top_k=top_k, tta=False)
                entry["classified_by"] = "efficientnet_v2_s-plantdoc"
                plant = ((entry["diagnosis"] or {}).get("plant") or "").lower()
                if plant in MAIZE_PLANTS:
                    def_clf, self.def_clf_error = _load(DeficiencyClassifier)
                    if def_clf:
                        try:
                            entry["deficiency"] = def_clf.predict(crop, top_k=top_k, tta=False)
                            entry["deficiency_by"] = "efficientnet_v2_s-maize-deficiency"
                        finally:
                            _free(def_clf)
            leaves.append(entry)

        pests: list[dict] = []
        for r in pest_regions[:MAX_PESTS]:
            pests.append({
                "box": r["box"],
                "det_confidence": r["confidence"],
                "area_fraction": r["area_fraction"],
                "species": None,
                "confidence": r["confidence"],
                "top_k": [],
                "located_by": "yolo",
                "classified_by": None,
            })

        fallback: dict | None = None
        if not leaves:
            located = locate_leaf(img)
            region = img.crop(located["box"]) if located else img
            fallback = {
                "box": located["box"] if located else None,
                "source": "colour_locator" if located else "full_image",
                "diagnosis": leaf_clf.predict(region, top_k=top_k, tta=False),
                "reliable": False,
            }

        if self._inject_leaf is None:
            _free(leaf_clf)

        findings: list[dict] = []
        for leaf in leaves:
            d = leaf["diagnosis"]
            if d and not d["healthy"] and d["confidence"] >= DISEASE_CONF_FINDING:
                findings.append({
                    "type": "disease",
                    "name": f"{d['plant']} - {d['disease']}",
                    "confidence": d["confidence"],
                    "box": leaf["box"],
                })
            defn = leaf.get("deficiency")
            if defn and defn.get("suspected_deficiency") and defn["confidence"] >= DEFICIENCY_CONF_FINDING:
                findings.append({
                    "type": "deficiency",
                    "name": f"{defn['crop']} - {defn['suspected_deficiency']}",
                    "confidence": defn["confidence"],
                    "box": leaf["box"],
                    "suspected_deficiency": defn["suspected_deficiency"],
                })
        for pest in pests:
            if pest["confidence"] >= PEST_CONF_FINDING or pest["det_confidence"] >= 0.5:
                findings.append({
                    "type": "pest",
                    "name": pest["species"] or "insect pest",
                    "confidence": pest["confidence"],
                    "box": pest["box"],
                })
        findings.sort(key=lambda f: -f["confidence"])

        healthy_leaves = [
            leaf for leaf in leaves
            if leaf["diagnosis"] and leaf["diagnosis"]["healthy"]
            and leaf["diagnosis"]["confidence"] >= DISEASE_CONF_FINDING
        ]
        if findings:
            summary = "; ".join(f"{f['name']} ({f['confidence']:.0%})" for f in findings)
        elif healthy_leaves:
            d = healthy_leaves[0]["diagnosis"]
            summary = f"{d['plant']} leaf looks healthy ({d['confidence']:.0%}); no pests located"
        elif leaves and all(leaf["too_small"] for leaf in leaves):
            summary = "Leaf is too small in the frame; move closer so one leaf fills most of the photo"
        elif fallback:
            d = fallback["diagnosis"]
            summary = (
                f"No leaf located by the detector; whole-image guess {d['plant']} - {d['disease']} "
                f"({d['confidence']:.0%}) is unreliable. Retake with one leaf filling the frame"
            )
        else:
            summary = "No confident disease or pest finding; retake with one leaf filling the frame in daylight"

        yolo_ok = bool(regions) and not self.detector_error
        report: dict[str, Any] = {
            "image_size": [w, h],
            "regions": regions,
            "leaves": leaves,
            "pests": pests,
            "fallback": fallback,
            "findings": findings,
            "summary": summary,
            "pipeline": {
                "mode": "camera_vision_subprocess_yolo",
                "description": "YOLO in child process (OOM-safe), then EfficientNetV2-S in API process.",
                "stages": [
                    {
                        "id": "yolo_locate",
                        "name": "YOLO locate",
                        "role": "Find leaf/pest boxes in a subprocess",
                        "model": "yolo11s-leaf-pest" if yolo_ok else ("colour_locator" if leaf_regions else None),
                        "leaf_boxes": len(leaf_regions),
                        "pest_boxes": len(pest_regions),
                        "error": self.detector_error,
                    },
                    {
                        "id": "efficientnet_classify",
                        "name": "EfficientNet classify",
                        "role": "Name plant disease on each leaf crop",
                        "model": "efficientnet_v2_s-plantdoc",
                        "leaves_classified": sum(1 for leaf in leaves if leaf.get("diagnosis")),
                    },
                ],
            },
            "models": {
                "detector": "yolo11s-leaf-pest" if yolo_ok else None,
                "leaf_classifier": "efficientnet_v2_s-plantdoc",
                "errors": {k: v for k, v in (
                    ("detector", self.detector_error),
                    ("leaf_classifier", self.leaf_clf_error),
                    ("deficiency_classifier", self.def_clf_error),
                ) if v},
            },
        }
        if annotate:
            report["annotated_image"] = self._annotate(img, leaves, pests, fallback)
        return report
