"""Inference for XGBoost farm advisory models — conservative, evidence-first wording."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Mapping

import joblib
import numpy as np

from .xgboost_features import FEATURE_NAMES, features_from_sources, vectorize

MODEL_DIR = Path(__file__).resolve().parent / "models" / "xgboost"

YIELD_FORMULA = (
    "Experimental index (not a yield forecast): start 70, minus dry soil, heat/cold, "
    "high TDS, then small rain credit. Unvalidated on this farm."
)


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
        sensor = sensor or {}
        weather = weather or {}
        feats = features_from_sources(sensor=sensor, weather=weather, hour=hour, month=month)
        x = np.asarray([vectorize(feats)], dtype=float)

        irrigate = self._predict_class("irrigate", x)
        stress = self._predict_class("stress_risk", x)
        # Still run unused heads so artifacts stay loaded; do not treat as farm truth.
        _ = self._predict_class("disease_climate_risk", x)
        _ = self._predict_class("price_trend", x)
        yield_pred = float(np.clip(self.bundles["yield_score"]["model"].predict(x)[0], 0, 100))

        soil = feats.get("soil_moisture")
        rain = feats.get("precipitation")
        et0 = feats.get("et0")
        temp = feats.get("temperature")
        hum = feats.get("humidity")
        tds = feats.get("tds")

        irrig_evidence = (
            f"Soil moisture {soil:.0f}% (uncalibrated probe), rain {rain:.1f} mm, ET0 {et0:.2f}. "
            "A single soil % cannot set a water volume. Check crop, last irrigation, and tank/rain."
        )
        irrigation = {
            **irrigate,
            "display": "Check irrigation requirement",
            "advice": irrig_evidence,
            "hide_confidence": True,
        }

        stress_bits = []
        if soil is not None and soil < 35:
            stress_bits.append(f"soil {soil:.0f}%")
        if temp is not None and temp >= 34:
            stress_bits.append(f"air {temp:.0f}°C")
        if hum is not None and hum < 35:
            stress_bits.append(f"humidity {hum:.0f}%")
        if tds is not None and tds >= 700:
            stress_bits.append(f"TDS {tds:.0f} ppm")
        evidence = ", ".join(stress_bits) if stress_bits else "current sensor/weather snapshot"
        stress_out = {
            **stress,
            "display": "Possible stress conditions — inspect plants",
            "advice": f"Readings suggest possible stress ({evidence}). This is not confirmed plant stress.",
            "hide_confidence": True,
        }

        disease_out = {
            "label": "insufficient_data",
            "display": "Disease-specific risk not shown",
            "advice": (
                "A single temperature/humidity snapshot cannot rule disease in or out. "
                "Need multi-day weather history and a crop-specific disease model."
            ),
            "hide_confidence": True,
        }

        from app.services.sensor_bus import parse_on_flag

        motor_flag = parse_on_flag(sensor.get("motor_on"))
        if motor_flag is None:
            motor_flag = parse_on_flag(sensor.get("motor"))
        ts = sensor.get("timestamp")
        ts_s = ts.isoformat() if hasattr(ts, "isoformat") else (str(ts) if ts else None)
        if motor_flag is None:
            motor_out = {
                "label": "unknown",
                "display": "Reported motor state: unknown",
                "advice": "No motor telemetry in the latest ESP payload.",
                "observation": True,
                "hide_confidence": True,
            }
        else:
            on = motor_flag
            motor_out = {
                "label": "on" if on else "off",
                "display": f"Reported motor state: {'ON' if on else 'OFF'}",
                "advice": (
                    f"Device report only (not an AI prediction)"
                    + (f", last MQTT {ts_s}" if ts_s else "")
                    + ". Command acknowledgement is not proof the pump is physically running."
                ),
                "observation": True,
                "hide_confidence": True,
                "timestamp": ts_s,
            }

        yield_out = {
            "value": round(yield_pred, 1),
            "display": f"Experimental growing index {yield_pred:.0f}/100",
            "advice": YIELD_FORMULA,
            "hide_confidence": True,
        }

        price_out = {
            "label": "unavailable",
            "display": "Market data unavailable",
            "advice": "Farm sensors do not indicate mandi prices. Connect Agmarknet/history to show a real trend.",
            "hide_confidence": True,
        }

        summary = " ".join(
            [
                irrigation["display"] + ".",
                stress_out["display"] + ".",
                disease_out["display"] + ".",
                motor_out["display"] + ".",
                yield_out["display"] + ".",
                price_out["display"] + ".",
            ]
        )

        return {
            "features": feats,
            "feature_names": FEATURE_NAMES,
            "irrigation": irrigation,
            "stress_risk": stress_out,
            "disease_climate_risk": disease_out,
            "motor": motor_out,
            "yield_score": yield_out,
            "price_trend": price_out,
            "summary": summary,
            "model": "xgboost-advisory-v2-conservative",
            "note": (
                "XGBoost is a decision aid on synthetic labels, not a prescription. "
                "Calibrate soil sensors; do not treat model confidence as field truth."
            ),
        }
