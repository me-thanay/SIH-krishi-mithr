from fastapi import APIRouter, HTTPException, UploadFile, File, Query, Form, Header
from typing import Any, Callable, Dict, List, Optional
import os
import threading
from datetime import datetime, timezone

router = APIRouter()

# ---------------------------------------------------------------------------
# ML models (all loaded lazily on first request so the API still boots on
# deployments that ship without torch / ultralytics or the trained weights).
#
#   /diagnose         two-stage pipeline: YOLO locates leaves & pests, then
#                     EfficientNetV2-S classifiers diagnose each region
#   /disease          single-leaf disease classifier only (no localisation)
#   /detect           locate + identify insect pests only
# ---------------------------------------------------------------------------
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/heic", "image/heif"}
MAX_IMAGE_BYTES = 15 * 1024 * 1024


class _Lazy:
    """Thread-safe lazy singleton. Retries after a failed load (e.g. torch installed mid-life)."""

    def __init__(self, name: str, factory: Callable[[], Any]):
        self.name, self._factory = name, factory
        self._obj, self._error = None, None
        self._lock = threading.Lock()

    def get(self):
        if self._obj is not None:
            return self._obj
        with self._lock:
            if self._obj is not None:
                return self._obj
            try:
                self._obj = self._factory()
                self._error = None
            except Exception as exc:  # torch missing, weights missing, etc.
                self._error = f"{type(exc).__name__}: {exc}"
                # Do not sticky-cache forever — next request retries after a redeploy.
                raise HTTPException(status_code=503, detail=f"{self.name} unavailable. {self._error}")
        return self._obj

    def reset(self) -> None:
        with self._lock:
            self._obj, self._error = None, None

    @property
    def status(self) -> Dict[str, Any]:
        return {"loaded": self._obj is not None, "error": self._error}


def _make_classifier():
    from ml.leaf_classifier import LeafClassifier
    return LeafClassifier()


def _make_pipeline():
    from ml.plant_diagnosis import PlantDiagnosisPipeline
    return PlantDiagnosisPipeline()


def _make_deficiency():
    from ml.leaf_classifier import DeficiencyClassifier
    return DeficiencyClassifier()


_classifier = _Lazy("Leaf disease model", _make_classifier)
_pipeline = _Lazy("Plant diagnosis pipeline", _make_pipeline)
_deficiency = _Lazy("Maize deficiency model", _make_deficiency)


async def _read_image(file: UploadFile) -> bytes:
    if file.content_type and file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported image type {file.content_type}")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image upload")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image larger than 15 MB")
    return contents


def _certainty(confidence: float) -> str:
    return "high" if confidence >= 0.75 else "medium" if confidence >= 0.45 else "low"


# ---------------------------------------------------------------------------
# Locate-then-diagnose (the main endpoint)
# ---------------------------------------------------------------------------
@router.post("/diagnose")
async def diagnose_plant(
    file: UploadFile = File(..., description="Photo of the plant / leaf from the camera"),
    top_k: int = Query(3, ge=1, le=10),
    det_conf: float = Query(0.25, ge=0.05, le=0.9, description="YOLO confidence threshold"),
    annotate: bool = Query(True, description="return a JPEG with boxes drawn (base64)"),
):
    """Locate leaves and pests with YOLO, then diagnose each region.

    Returns per-leaf disease diagnoses, per-pest species identifications, ranked findings,
    a plain-language summary and (optionally) an annotated image.
    """
    contents = await _read_image(file)
    pipeline = _pipeline.get()
    try:
        report = pipeline.diagnose(contents, det_conf=det_conf, top_k=top_k, annotate=annotate)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}")

    best = report["findings"][0]["confidence"] if report["findings"] else 0.0
    report["certainty"] = _certainty(best) if report["findings"] else "none"
    report["advice"] = (
        None
        if report["findings"] and report["certainty"] != "low"
        else "Retake with one leaf (or the insect) filling the frame, in daylight, against a plain background."
    )
    report["filename"] = file.filename
    return report


@router.get("/models")
async def model_status():
    """Which ML models are present / loaded (does not trigger loading)."""
    return {
        "diagnosis_pipeline": _pipeline.status,
        "leaf_classifier": _classifier.status,
        "deficiency_classifier": _deficiency.status,
    }


@router.api_route("/warmup", methods=["GET", "POST"])
async def warmup_models():
    """Load YOLO + EfficientNet into memory so the next /diagnose is fast."""
    _pipeline.reset()
    try:
        _pipeline.get()
    except HTTPException as exc:
        return {"ok": False, "detail": exc.detail, "diagnosis_pipeline": _pipeline.status}
    return {"ok": True, "diagnosis_pipeline": _pipeline.status}


# ---------------------------------------------------------------------------
# Single-leaf disease classifier (no localisation)
# ---------------------------------------------------------------------------
@router.post("/disease")
async def classify_leaf_disease(
    file: UploadFile = File(..., description="Clear photo of a single leaf from the camera"),
    top_k: int = Query(3, ge=1, le=10),
):
    """Classify plant disease from a single leaf photo (EfficientNetV2-S, PlantDoc classes)."""
    contents = await _read_image(file)
    classifier = _classifier.get()
    try:
        result = classifier.predict(contents, top_k=top_k)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read image: {exc}")

    certainty = _certainty(result["confidence"])
    return {
        **result,
        "certainty": certainty,
        "advice": (
            "Retake the photo with one leaf filling the frame, in daylight, against a plain background."
            if certainty == "low"
            else None
        ),
        "filename": file.filename,
    }


@router.get("/disease/classes")
async def list_disease_classes():
    """List the plant/disease classes the leaf model can recognise."""
    classifier = _classifier.get()
    return {"count": len(classifier.class_info), "classes": classifier.class_info}


# ---------------------------------------------------------------------------
# Maize nutrient deficiency (crop-specific EfficientNetV2-S)
# ---------------------------------------------------------------------------
@router.post("/deficiency")
async def classify_maize_deficiency(
    file: UploadFile = File(..., description="Clear photo of a maize leaf"),
    top_k: int = Query(3, ge=1, le=10),
):
    """Return the suspected maize nutrient-deficiency class."""
    contents = await _read_image(file)
    classifier = _deficiency.get()
    try:
        result = classifier.predict(contents, top_k=top_k)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read image: {exc}")

    certainty = _certainty(result["confidence"])
    return {
        **result,
        "certainty": certainty,
        "advice": (
            "Retake with one maize leaf filling the frame, in daylight."
            if certainty == "low"
            else None
        ),
        "filename": file.filename,
    }


@router.get("/deficiency/classes")
async def list_deficiency_classes():
    """List maize nutrient-deficiency classes the model can recognise."""
    classifier = _deficiency.get()
    return {"crop": "Maize", "count": len(classifier.class_info), "classes": classifier.class_info}


# ---------------------------------------------------------------------------
# Pest-only detection (YOLO pest boxes + IP102 species classifier)
# ---------------------------------------------------------------------------
@router.post("/detect")
async def detect_pest(
    file: UploadFile = File(...),
    det_conf: float = Query(0.25, ge=0.05, le=0.9),
):
    """Locate insect pests in the photo and identify their species."""
    contents = await _read_image(file)
    pipeline = _pipeline.get()
    try:
        report = pipeline.diagnose(contents, det_conf=det_conf, top_k=3, annotate=False)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}")

    detected = [
        {
            "name": p["species"] or "insect pest",
            "confidence": p["confidence"],
            "detection_confidence": p["det_confidence"],
            "box": p["box"],
            "alternatives": p["top_k"],
        }
        for p in report["pests"]
    ]
    return {
        "detected_pests": detected,
        "image_size": report["image_size"],
        "summary": report["summary"] if detected else "No insect pests located in the photo",
        "image_processed": True,
    }


@router.get("/pests")
async def list_pests():
    """List the insect pest species the IP102 models can recognise."""
    pipeline = _pipeline.get()
    if pipeline.pest_clf is not None:
        return {
            "count": len(pipeline.pest_clf.class_info),
            "pests": [{"id": c["index"], "name": c["name"]} for c in pipeline.pest_clf.class_info],
        }
    if getattr(pipeline, "pest_det", None) is not None:
        names = pipeline.pest_det.names
        return {
            "count": len(names),
            "pests": [{"id": i, "name": names[i]} for i in sorted(names)],
        }
    raise HTTPException(
        status_code=503,
        detail=f"Pest identifier unavailable. {pipeline.pest_clf_error or getattr(pipeline, 'pest_det_error', '')}",
    )


def _check_device_key(x_device_key: Optional[str]) -> None:
    expected = (os.getenv("DEVICE_UPLOAD_KEY") or "").strip()
    if not expected:
        return
    if not x_device_key or x_device_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Device-Key")


# ---------------------------------------------------------------------------
# ESP32-CAM (and other field cameras): diagnose + persist for the dashboard
# ---------------------------------------------------------------------------
@router.post("/device-scan")
async def device_camera_scan(
    file: UploadFile = File(..., description="JPEG from ESP32-CAM"),
    device_id: str = Form("esp32-cam"),
    trigger: str = Form("interval"),
    top_k: int = Query(3, ge=1, le=10),
    det_conf: float = Query(0.25, ge=0.05, le=0.9),
    annotate: bool = Query(True, description="store annotated JPEG for the website"),
    x_device_key: Optional[str] = Header(None, alias="X-Device-Key"),
):
    """Accept a still from field hardware, run locate-then-diagnose, save to Mongo.

    Returns a small JSON body suitable for ESP32 (no huge base64 in the response).
    """
    _check_device_key(x_device_key)
    contents = await _read_image(file)
    pipeline = _pipeline.get()
    try:
        report = pipeline.diagnose(contents, det_conf=det_conf, top_k=top_k, annotate=annotate)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}")

    best = report["findings"][0]["confidence"] if report["findings"] else 0.0
    certainty = _certainty(best) if report["findings"] else "none"
    advice = (
        None
        if report["findings"] and certainty != "low"
        else "Move the camera closer so one leaf (or insect) fills the frame, in daylight."
    )

    from app.camera_scans import save_camera_scan

    scan_doc = {
        "device_id": device_id,
        "trigger": trigger,
        "summary": report.get("summary"),
        "certainty": certainty,
        "advice": advice,
        "findings": report.get("findings") or [],
        "pipeline": report.get("pipeline"),
        "leaves": [
            {
                "box": leaf.get("box"),
                "det_confidence": leaf.get("det_confidence"),
                "diagnosis": leaf.get("diagnosis"),
                "deficiency": leaf.get("deficiency"),
                "located_by": leaf.get("located_by"),
                "classified_by": leaf.get("classified_by"),
            }
            for leaf in (report.get("leaves") or [])
        ],
        "pests": [
            {
                "box": pest.get("box"),
                "species": pest.get("species"),
                "confidence": pest.get("confidence"),
                "det_confidence": pest.get("det_confidence"),
                "located_by": pest.get("located_by"),
                "classified_by": pest.get("classified_by"),
            }
            for pest in (report.get("pests") or [])
        ],
        "annotated_image": report.get("annotated_image") if annotate else None,
        "image_size": report.get("image_size"),
        "timestamp": datetime.now(timezone.utc),
    }
    scan_id = save_camera_scan(scan_doc)

    return {
        "ok": True,
        "saved": scan_id is not None,
        "scan_id": scan_id,
        "device_id": device_id,
        "summary": report.get("summary"),
        "certainty": certainty,
        "findings_count": len(report.get("findings") or []),
        "top_finding": (report.get("findings") or [None])[0],
        "advice": advice,
    }


@router.get("/device-scan/latest")
async def latest_device_scan(device_id: Optional[str] = Query(None)):
    """Latest ESP32-CAM diagnose result (for dashboards / debugging)."""
    from app.camera_scans import latest_camera_scan

    doc = latest_camera_scan(device_id)
    if not doc:
        return {"data": None, "message": "No camera scans yet"}
    return {"data": doc, "updated": True}
