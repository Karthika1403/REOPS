import time
import uuid
import json
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score
)

from backend.models.registry import MODEL_REGISTRY
from backend.datasets.service import load_builtin_dataframe, _load_metadata
from backend.datasets.registry import BUILTIN_DATASETS

RUNS_FILE = "backend/models/runs.json"


def _load_runs():
    if not os.path.exists(RUNS_FILE):
        return {}
    with open(RUNS_FILE, "r") as f:
        return json.load(f)


def _save_runs(data):
    os.makedirs(os.path.dirname(RUNS_FILE), exist_ok=True)
    with open(RUNS_FILE, "w") as f:
        json.dump(data, f, indent=2, default=str)


def _load_dataset_df(dataset_id: str) -> pd.DataFrame:
    if dataset_id in BUILTIN_DATASETS:
        return load_builtin_dataframe(dataset_id)
    metadata = _load_metadata()
    if dataset_id not in metadata:
        raise ValueError("Dataset not found")
    return pd.read_csv(metadata[dataset_id]["file_path"])


def get_dataset_columns(dataset_id: str):
    df = _load_dataset_df(dataset_id)
    return {
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "suggested_target": df.columns[-1]  # naive default: last column
    }


def train_model(dataset_id: str, model_id: str, target_column: str, hyperparams: dict, run_id: str = None):
    if model_id not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model: {model_id}")

    model_meta = MODEL_REGISTRY[model_id]
    task_type = model_meta["task"]

    df = _load_dataset_df(dataset_id)

    if task_type != "clustering" and target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset")

    # Drop rows with missing values (simple strategy for v1)
    df = df.dropna()

    if task_type == "clustering":
        X = df.select_dtypes(include=[np.number])
        y = None
    else:
        y = df[target_column]
        X = df.drop(columns=[target_column]).select_dtypes(include=[np.number])

        if task_type == "classification" and y.dtype == "object":
            le = LabelEncoder()
            y = le.fit_transform(y)

    if X.shape[1] == 0:
        raise ValueError("No numeric features available after dropping target column")

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model_cls = model_meta["cls"]
    valid_params = {
        k: v for k, v in hyperparams.items()
        if k in model_meta["params"]
    }

    start_time = time.time()

    if task_type == "clustering":
        model = model_cls(**valid_params)
        labels = model.fit_predict(X_scaled)
        metrics = {}
        if len(set(labels)) > 1:
            metrics["silhouette_score"] = round(float(silhouette_score(X_scaled, labels)), 4)
        metrics["n_clusters_found"] = len(set(labels)) - (1 if -1 in labels else 0)
        metrics["n_samples"] = int(X_scaled.shape[0])
        artifacts = {"cluster_sizes": {str(k): int(v) for k, v in pd.Series(labels).value_counts().items()}}
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        model = model_cls(**valid_params)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        if task_type == "classification":
            metrics = {
                "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
                "precision": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
                "f1_score": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
            }
            cm = confusion_matrix(y_test, y_pred)
            artifacts = {"confusion_matrix": cm.tolist()}
        else:
            metrics = {
                "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
                "mae": round(float(mean_absolute_error(y_test, y_pred)), 4),
                "r2_score": round(float(r2_score(y_test, y_pred)), 4),
            }
            artifacts = {
                "predictions_sample": y_pred[:20].tolist(),
                "actuals_sample": (y_test[:20].tolist() if hasattr(y_test, "tolist") else list(y_test[:20]))
            }

    duration = round(time.time() - start_time, 2)

    if not run_id:
        run_id = str(uuid.uuid4())

    run_record = {
        "id": run_id,
        "dataset_id": dataset_id,
        "model_id": model_id,
        "model_name": model_meta["name"],
        "task_type": task_type,
        "target_column": target_column if task_type != "clustering" else None,
        "hyperparams": valid_params,
        "metrics": metrics,
        "artifacts": artifacts,
        "n_features": int(X.shape[1]),
        "n_samples": int(X.shape[0]),
        "duration_seconds": duration,
        "status": "completed",
        "created_at": time.time()
    }

    runs = _load_runs()
    runs[run_id] = run_record
    _save_runs(runs)

    return run_record


def get_run(run_id: str):
    runs = _load_runs()
    return runs.get(run_id)


def get_all_runs():
    runs = _load_runs()
    return sorted(runs.values(), key=lambda r: r["created_at"], reverse=True)


def delete_run(run_id: str):
    runs = _load_runs()
    if run_id in runs:
        del runs[run_id]
        _save_runs(runs)
        return True
    return False