"""Inference for XGBoost farm advisory models."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Mapping

import joblib
import numpy as np

from .xgboost_features import FEATURE_NAMES, features_from_sources, vectorize

MODEL_DIR = Path(__file__).resolve().parent / "models" / "xgboost"

IRRIGATE_ADVICE = {
    "skip": "Skip irrigation for now - soil/rain outlook is adequate.",
    "light": "Apply light irrigation; check ESP soil moisture after 2-3 hours.",
    "full": "Full irrigation recommended - soil is dry or evaporative demand is high.",
}
STRESS_ADVICE = {
    "low": "Crop stress risk is low.",
    "medium": "Moderate stress risk - monitor wilt and leaf curl.",
    "high": "High stress risk - prioritize water, shade, or nutrient correction.",
}
DISEASE_ADVICE = {
    "low": "Climate is not strongly disease-favourable.",
    "medium": "Humid conditions may favour fungal disease - improve airflow and scout leaves.",
    "high": "High disease-climate risk - scout closely; consider preventive spray if history exists.",
}
MOTOR_ADVICE = {
    "off": "Keep pump/motor off for now.",
    "on": "Motor/pump on is consistent with irrigation need (confirm rain and tank level).",
}
PRICE_ADVICE = {
    "down": "Price trend proxy: downward pressure (season/supply).",
    "stable": "Price trend proxy: roughly stable.",
    "up": "Price trend proxy: upward pressure (possible supply stress).",
}


class XGBoostAdvisor:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.model_dir = Path(model_dir)
        if not self.model_dir.exists():
            raise FileNotFoundError(
                f"XGBoost models not found at {self.model_dir}. "
                "Run: python ml/train_xgboost_advisory.py"
            )
        self.bundles: dict[str, Any] = {}
        for name in (
            "irrigate",
            "stress_risk",
            "disease_climate_risk",
            "motor_on",
            "price_trend",
            "yield_score",
        ):
            path = self.model_dir / f"{name}.joblib"
            if not path.exists():
                raise FileNotFoundError(f"Missing {path}")
            self.bundles[name] = joblib.load(path)

    def _predict_class(self, name: str, x: np.ndarray) -> dict[str, Any]:
        bundle = self.bundles[name]
        model = bundle["model"]
        labels: list[str] = bundle["labels"]
        proba = model.predict_proba(x)[0]
        idx = int(np.argmax(proba))
        # binary models may return shape (2,)
        if len(labels) == 2 and len(proba) == 2:
            idx = int(np.argmax(proba))
        label = labels[idx] if idx < len(labels) else str(idx)
        return {
            "label": label,
            "confidence": round(float(proba[idx]), 4),
            "probabilities": {labels[i]: round(float(proba[i]), 4) for i in range(min(len(labels), len(proba)))},
        }

    def predict(
        self,
        sensor: Mapping[str, Any] | None = None,
        weather: Mapping[str, Any] | None = None,
        hour: int | None = None,
        month: int | None = None,
    ) -> dict[str, Any]:
        feats = features_from_sources(sensor=sensor, weather=weather, hour=hour, month=month)
        x = np.asarray([vectorize(feats)], dtype=float)

        irrigate = self._predict_class("irrigate", x)
        stress = self._predict_class("stress_risk", x)
        disease = self._predict_class("disease_climate_risk", x)
        motor = self._predict_class("motor_on", x)
        price = self._predict_class("price_trend", x)
        yield_pred = float(self.bundles["yield_score"]["model"].predict(x)[0])
        yield_pred = float(np.clip(yield_pred, 0, 100))

        actions: list[str] = [
            IRRIGATE_ADVICE.get(irrigate["label"], ""),
            STRESS_ADVICE.get(stress["label"], ""),
            DISEASE_ADVICE.get(disease["label"], ""),
            MOTOR_ADVICE.get(motor["label"], ""),
            PRICE_ADVICE.get(price["label"], ""),
            f"Growing-condition score: {yield_pred:.0f}/100.",
        ]

        return {
            "features": feats,
            "feature_names": FEATURE_NAMES,
            "irrigation": {**irrigate, "advice": IRRIGATE_ADVICE.get(irrigate["label"])},
            "stress_risk": {**stress, "advice": STRESS_ADVICE.get(stress["label"])},
            "disease_climate_risk": {**disease, "advice": DISEASE_ADVICE.get(disease["label"])},
            "motor": {**motor, "advice": MOTOR_ADVICE.get(motor["label"])},
            "yield_score": {"value": round(yield_pred, 1), "advice": f"Growing-condition score {yield_pred:.0f}/100."},
            "price_trend": {**price, "advice": PRICE_ADVICE.get(price["label"])},
            "summary": " ".join(a for a in actions if a),
            "model": "xgboost-advisory-v1",
            "note": "Bootstrapped from agronomic heuristics + synthetic data; retrain on your labeled farm logs for production.",
        }
