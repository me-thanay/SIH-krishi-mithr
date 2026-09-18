"""Train XGBoost advisory models (irrigation, stress, disease climate, motor, yield, price).

Usage (repo root):
    pip install xgboost scikit-learn pandas
    python -u ml/generate_xgboost_data.py
    python -u ml/train_xgboost_advisory.py

Outputs under ml/models/xgboost/
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier, XGBRegressor

ML_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ML_DIR))

from xgboost_features import FEATURE_NAMES  # noqa: E402

DATA_CSV = ML_DIR / "datasets" / "xgboost_advisory_synth.csv"
OUT_DIR = ML_DIR / "models" / "xgboost"

CLASS_TARGETS = {
    "irrigate": ["skip", "light", "full"],
    "stress_risk": ["low", "medium", "high"],
    "disease_climate_risk": ["low", "medium", "high"],
    "motor_on": ["off", "on"],
    "price_trend": ["down", "stable", "up"],
}
REG_TARGETS = ["yield_score"]


def train_classifier(X_train, y_train, X_test, y_test, n_classes: int):
    model = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob" if n_classes > 2 else "binary:logistic",
        num_class=n_classes if n_classes > 2 else None,
        eval_metric="mlogloss" if n_classes > 2 else "logloss",
        tree_method="hist",
        random_state=42,
        n_jobs=2,
    )
    # binary objective ignores num_class
    if n_classes == 2:
        model = XGBClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            random_state=42,
            n_jobs=2,
        )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    return model, {
        "accuracy": float(accuracy_score(y_test, pred)),
        "macro_f1": float(f1_score(y_test, pred, average="macro")),
    }


def train_regressor(X_train, y_train, X_test, y_test):
    model = XGBRegressor(
        n_estimators=140,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        tree_method="hist",
        random_state=42,
        n_jobs=2,
    )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    return model, {
        "mae": float(mean_absolute_error(y_test, pred)),
        "r2": float(r2_score(y_test, pred)),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DATA_CSV)
    parser.add_argument("--out", type=Path, default=OUT_DIR)
    args = parser.parse_args()

    if not args.data.exists():
        from generate_xgboost_data import generate

        args.data.parent.mkdir(parents=True, exist_ok=True)
        generate(8000).to_csv(args.data, index=False)
        print(f"Generated {args.data}")

    df = pd.read_csv(args.data)
    X = df[FEATURE_NAMES].astype(float).values
    args.out.mkdir(parents=True, exist_ok=True)

    metrics: dict = {"features": FEATURE_NAMES, "models": {}}

    for target, labels in CLASS_TARGETS.items():
        y = df[target].astype(int).values
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        n_classes = len(labels)
        model, m = train_classifier(X_train, y_train, X_test, y_test, n_classes)
        path = args.out / f"{target}.joblib"
        joblib.dump({"model": model, "labels": labels, "features": FEATURE_NAMES}, path)
        metrics["models"][target] = {**m, "path": path.name, "labels": labels}
        print(f"{target}: acc={m['accuracy']:.3f} f1={m['macro_f1']:.3f} -> {path}")

    for target in REG_TARGETS:
        y = df[target].astype(float).values
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model, m = train_regressor(X_train, y_train, X_test, y_test)
        path = args.out / f"{target}.joblib"
        joblib.dump({"model": model, "features": FEATURE_NAMES}, path)
        metrics["models"][target] = {**m, "path": path.name}
        print(f"{target}: mae={m['mae']:.2f} r2={m['r2']:.3f} -> {path}")

    (args.out / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(f"Saved metrics -> {args.out / 'metrics.json'}")


if __name__ == "__main__":
    main()
