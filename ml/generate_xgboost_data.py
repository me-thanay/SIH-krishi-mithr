"""Generate synthetic agronomic training rows for XGBoost advisory models.

Labels follow field heuristics so the models bootstrap without years of farm logs.
Replace later with real labeled MQTT + outcome data.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from xgboost_features import FEATURE_NAMES

ML_DIR = Path(__file__).resolve().parent
OUT_CSV = ML_DIR / "datasets" / "xgboost_advisory_synth.csv"


def _label_row(r: dict) -> dict:
    soil = r["soil_moisture"]
    rain = r["precipitation"]
    precip_p = r["precip_probability"]
    temp = r["temperature"]
    hum = r["humidity"]
    et0 = r["et0"]
    tds = r["tds"]
    wind = r["wind_speed"]
    month = r["month"]

    # Irrigation: 0=skip, 1=light, 2=full
    if rain >= 3 or precip_p >= 70 or soil >= 65:
        irrigate = 0
    elif soil < 25 or (soil < 40 and et0 > 4 and rain < 1):
        irrigate = 2
    elif soil < 45 or (hum < 40 and et0 > 3):
        irrigate = 1
    else:
        irrigate = 0

    # Crop stress: 0 low, 1 medium, 2 high
    stress = 0
    if soil < 20 or temp >= 38 or temp <= 10 or tds >= 900:
        stress = 2
    elif soil < 35 or temp >= 34 or hum < 30 or tds >= 700:
        stress = 1

    # Disease climate (fungal-friendly): humid + mild + wet
    disease = 0
    if hum >= 85 and 18 <= temp <= 30 and (rain > 0.5 or soil > 70):
        disease = 2
    elif hum >= 75 and 16 <= temp <= 32 and (rain > 0 or soil > 55):
        disease = 1

    motor_on = 1 if irrigate >= 1 and rain < 2 else 0

    # Yield score 0-100 (higher is better growing window)
    yield_score = 70.0
    yield_score -= max(0, 30 - soil) * 0.8
    yield_score -= max(0, temp - 34) * 2.5
    yield_score -= max(0, 16 - temp) * 2.0
    yield_score -= max(0, tds - 600) * 0.04
    yield_score -= disease * 8
    yield_score -= stress * 6
    yield_score += min(rain, 5) * 1.5
    yield_score = float(np.clip(yield_score, 5, 98))

    # Price trend proxy: monsoon/harvest months + rain shock
    # 0 down, 1 stable, 2 up
    if month in (6, 7, 8) and rain > 8:
        price_trend = 0  # glut risk after heavy rain harvest windows
    elif month in (10, 11, 3, 4) and rain < 2 and stress >= 1:
        price_trend = 2  # supply stress
    elif abs(rain) < 1 and 20 <= temp <= 32:
        price_trend = 1
    else:
        price_trend = 1 if wind < 35 else 0

    return {
        "irrigate": irrigate,
        "stress_risk": stress,
        "disease_climate_risk": disease,
        "motor_on": motor_on,
        "yield_score": yield_score,
        "price_trend": price_trend,
    }


def generate(n: int = 8000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []
    for _ in range(n):
        r = {
            "temperature": float(rng.uniform(8, 44)),
            "humidity": float(rng.uniform(15, 98)),
            "soil_moisture": float(rng.uniform(5, 95)),
            "tds": float(rng.uniform(50, 1400)),
            "co2_ppm": float(rng.uniform(350, 900)),
            "nh3_ppm": float(rng.uniform(0, 40)),
            "benzene_ppm": float(rng.uniform(0, 15)),
            "smoke_ppm": float(rng.uniform(0, 30)),
            "light": float(rng.integers(0, 2)),
            "motion": float(rng.integers(0, 2)),
            "weather_temp": float(rng.uniform(10, 42)),
            "weather_humidity": float(rng.uniform(20, 95)),
            "precipitation": float(max(0, rng.exponential(1.2))),
            "precip_probability": float(rng.uniform(0, 100)),
            "wind_speed": float(rng.uniform(0, 60)),
            "et0": float(rng.uniform(0.5, 8)),
            "uv_index": float(rng.uniform(0, 12)),
            "soil_moisture_model": float(rng.uniform(0.05, 0.55)),
            "soil_temp_model": float(rng.uniform(12, 40)),
            "hour": float(rng.integers(0, 24)),
            "month": float(rng.integers(1, 13)),
        }
        # Correlate weather_temp lightly with sensor temp
        r["weather_temp"] = float(np.clip(0.7 * r["temperature"] + 0.3 * r["weather_temp"], 8, 44))
        labels = _label_row(r)
        rows.append({**r, **labels})
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=8000)
    parser.add_argument("--out", type=Path, default=OUT_CSV)
    args = parser.parse_args()
    df = generate(args.n)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Wrote {len(df)} rows -> {args.out}")
    print("Columns:", list(df.columns))
    print(df[["irrigate", "stress_risk", "disease_climate_risk", "motor_on", "price_trend"]].mean())


if __name__ == "__main__":
    main()
