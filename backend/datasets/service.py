import os
import time
import json
import uuid
import pandas as pd
from backend.datasets.registry import BUILTIN_DATASETS
import math
import re
DATASET_DIR = "backend/datasets/storage"
METADATA_FILE = "backend/datasets/metadata.json"

MAX_ROWS = 200_000
MAX_FILE_SIZE_MB = 50

_openml_catalog_cache = None
def _safe_int(value, default=0):
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return default
        return int(value)
    except (ValueError, TypeError):
        return default
    




def _normalize(text: str) -> str:
    return re.sub(r"[\s\-_]+", "", str(text).lower())


def search_openml(query: str, limit: int = 20):
    global _openml_catalog_cache
    import openml

    try:
        if _openml_catalog_cache is None:
            print("Fetching OpenML catalog (first time, may take a moment)...")
            _openml_catalog_cache = openml.datasets.list_datasets(output_format="dataframe")
            print(f"OpenML catalog loaded: {len(_openml_catalog_cache)} datasets")

        results = _openml_catalog_cache

        if query and query.strip():
            normalized_query = _normalize(query)
            mask = results["name"].apply(
                lambda name: normalized_query in _normalize(name)
            )
            results = results[mask]

            # Sort: exact-ish matches first, then by popularity (more instances = more established)
            results = results.copy()
            results["_match_score"] = results["name"].apply(
                lambda name: 0 if _normalize(name) == normalized_query else 1
            )
            results = results.sort_values(
                by=["_match_score", "NumberOfInstances"],
                ascending=[True, False]
            )

        results = results.head(limit)

        datasets = []
        for _, row in results.iterrows():
            n_classes = _safe_int(row.get("NumberOfClasses"))
            datasets.append({
                "openml_id": _safe_int(row.get("did")),
                "name": str(row.get("name", "Unknown")),
                "n_rows": _safe_int(row.get("NumberOfInstances")),
                "n_cols": _safe_int(row.get("NumberOfFeatures")),
                "n_classes": n_classes,
                "task_type": "classification" if n_classes > 0 else "regression"
            })
        return datasets
    except Exception as e:
        print(f"OpenML search error: {e}")
        return {"error": str(e)}


def _load_metadata():
    if not os.path.exists(METADATA_FILE):
        return {}
    with open(METADATA_FILE, "r") as f:
        return json.load(f)


def _save_metadata(data):
    os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
    with open(METADATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def list_builtin_datasets():
    result = []
    for key, meta in BUILTIN_DATASETS.items():
        try:
            data = meta["loader"](as_frame=True)
            df = data.frame
            result.append({
                "id": key,
                "name": meta["name"],
                "description": meta["description"],
                "task_type": meta["task_type"],
                "source": meta["source"],
                "n_rows": df.shape[0],
                "n_cols": df.shape[1] - 1,
            })
        except Exception as e:
            result.append({
                "id": key,
                "name": meta["name"],
                "description": meta["description"],
                "task_type": meta["task_type"],
                "source": meta["source"],
                "error": str(e)
            })
    return result


def load_builtin_dataframe(dataset_id: str) -> pd.DataFrame:
    if dataset_id not in BUILTIN_DATASETS:
        raise ValueError(f"Unknown builtin dataset: {dataset_id}")
    meta = BUILTIN_DATASETS[dataset_id]
    data = meta["loader"](as_frame=True)
    return data.frame


def import_openml_dataset(openml_id: int):
    import openml
    dataset = openml.datasets.get_dataset(openml_id)
    df, *_ = dataset.get_data(dataset_format="dataframe")

    if df.shape[0] > MAX_ROWS:
        raise ValueError(f"Dataset too large ({df.shape[0]} rows). Max allowed: {MAX_ROWS}")

    dataset_uuid = str(uuid.uuid4())
    os.makedirs(DATASET_DIR, exist_ok=True)
    file_path = os.path.join(DATASET_DIR, f"{dataset_uuid}.csv")
    df.to_csv(file_path, index=False)

    metadata = _load_metadata()
    metadata[dataset_uuid] = {
        "id": dataset_uuid,
        "name": dataset.name,
        "source": "openml",
        "openml_id": openml_id,
        "file_path": file_path,
        "n_rows": df.shape[0],
        "n_cols": df.shape[1],
        "uploaded_at": time.time()
    }
    _save_metadata(metadata)

    return metadata[dataset_uuid]


def save_uploaded_dataset(file_path: str, filename: str):
    df = pd.read_csv(file_path)

    if df.shape[0] > MAX_ROWS:
        raise ValueError(f"Dataset too large ({df.shape[0]} rows). Max allowed: {MAX_ROWS}")

    dataset_uuid = str(uuid.uuid4())

    metadata = _load_metadata()
    metadata[dataset_uuid] = {
        "id": dataset_uuid,
        "name": filename,
        "source": "upload",
        "file_path": file_path,
        "n_rows": df.shape[0],
        "n_cols": df.shape[1],
        "uploaded_at": time.time()
    }
    _save_metadata(metadata)

    return metadata[dataset_uuid]


def get_dataset_preview(dataset_id: str):
    # Builtin dataset
    if dataset_id in BUILTIN_DATASETS:
        df = load_builtin_dataframe(dataset_id)
        meta = BUILTIN_DATASETS[dataset_id]
        source = "sklearn"
        name = meta["name"]
    else:
        # Uploaded or OpenML-imported dataset
        metadata = _load_metadata()
        if dataset_id not in metadata:
            raise ValueError("Dataset not found")
        entry = metadata[dataset_id]
        df = pd.read_csv(entry["file_path"])
        source = entry["source"]
        name = entry["name"]

    preview = {
        "id": dataset_id,
        "name": name,
        "source": source,
        "shape": {"rows": df.shape[0], "cols": df.shape[1]},
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
        "head": df.head(10).fillna("").to_dict(orient="records"),
        "numeric_summary": json.loads(df.describe().to_json()) if not df.select_dtypes(include="number").empty else {}
    }
    return preview



def list_all_datasets():
    builtin = list_builtin_datasets()
    metadata = _load_metadata()
    imported = list(metadata.values())
    return {"builtin": builtin, "imported": imported}

def get_dataset_columns(dataset_id: str):
    if dataset_id in BUILTIN_DATASETS:
        df = load_builtin_dataframe(dataset_id)
    else:
        metadata = _load_metadata()
        if dataset_id not in metadata:
            raise ValueError("Dataset not found")
        df = pd.read_csv(metadata[dataset_id]["file_path"])

    suggested_target = df.columns[-1]
    target_series = df[suggested_target]
    n_unique = target_series.nunique()
    is_numeric = pd.api.types.is_numeric_dtype(target_series)

    if not is_numeric:
        suggested_task = "classification"
    elif n_unique <= 20:
        suggested_task = "classification"
    else:
        suggested_task = "regression"

    return {
        "columns": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "suggested_target": suggested_target,
        "suggested_task": suggested_task
    }