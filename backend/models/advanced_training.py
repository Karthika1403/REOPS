import time
import uuid
import json
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, KFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif, f_regression, mutual_info_classif
from sklearn.ensemble import VotingClassifier, VotingRegressor, StackingClassifier, StackingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    mean_squared_error, mean_absolute_error, r2_score, confusion_matrix
)

from backend.models.registry import MODEL_REGISTRY
from backend.models.training import _load_dataset_df, _load_runs, _save_runs


def _prepare_data(dataset_id, target_column, task_type, feature_selection=None):
    df = _load_dataset_df(dataset_id)
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

    if feature_selection and y is not None and X.shape[1] > feature_selection:
        score_func = f_classif if task_type == "classification" else f_regression
        selector = SelectKBest(score_func=score_func, k=feature_selection)
        X = pd.DataFrame(selector.fit_transform(X, y),
                         columns=X.columns[selector.get_support()])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, X.shape[1], df.shape[0], list(X.columns)


def train_multiple_models(
    dataset_id, model_ids, target_column, task_type,
    hyperparams_map=None, use_cross_validation=True,
    feature_selection=None, cv_folds=5
):
    X, y, n_features, n_samples, feature_names = _prepare_data(
        dataset_id, target_column, task_type, feature_selection
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    session_id = str(uuid.uuid4())
    results = []
    runs = _load_runs()

    for model_id in model_ids:
        if model_id not in MODEL_REGISTRY:
            continue

        meta = MODEL_REGISTRY[model_id]
        params = hyperparams_map.get(model_id, {}) if hyperparams_map else {}
        valid_params = {k: v for k, v in params.items() if k in meta["params"]}

        start = time.time()
        model = meta["cls"](**valid_params)

        metrics = {}
        artifacts = {}

        if use_cross_validation:
            cv = StratifiedKFold(n_splits=cv_folds) if task_type == "classification" else KFold(n_splits=cv_folds)
            if task_type == "classification":
                cv_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
                metrics["cv_accuracy_mean"] = round(float(cv_scores.mean()), 4)
                metrics["cv_accuracy_std"] = round(float(cv_scores.std()), 4)
            else:
                cv_scores = cross_val_score(model, X, y, cv=cv, scoring="r2")
                metrics["cv_r2_mean"] = round(float(cv_scores.mean()), 4)
                metrics["cv_r2_std"] = round(float(cv_scores.std()), 4)

        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        if task_type == "classification":
            metrics["accuracy"] = round(float(accuracy_score(y_test, y_pred)), 4)
            metrics["f1_score"] = round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
            metrics["precision"] = round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
            metrics["recall"] = round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
            artifacts["confusion_matrix"] = confusion_matrix(y_test, y_pred).tolist()
        else:
            metrics["rmse"] = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4)
            metrics["mae"] = round(float(mean_absolute_error(y_test, y_pred)), 4)
            metrics["r2_score"] = round(float(r2_score(y_test, y_pred)), 4)

        # Feature importance if available
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            artifacts["feature_importance"] = {
                name: round(float(imp), 4)
                for name, imp in sorted(
                    zip(feature_names, importances),
                    key=lambda x: x[1], reverse=True
                )
            }

        duration = round(time.time() - start, 2)
        run_id = str(uuid.uuid4())

        record = {
            "id": run_id,
            "session_id": session_id,
            "dataset_id": dataset_id,
            "model_id": model_id,
            "model_name": meta["name"],
            "task_type": task_type,
            "target_column": target_column,
            "hyperparams": valid_params,
            "metrics": metrics,
            "artifacts": artifacts,
            "n_features": n_features,
            "n_samples": n_samples,
            "feature_names": feature_names,
            "feature_selection": feature_selection,
            "cv_folds": cv_folds if use_cross_validation else None,
            "duration_seconds": duration,
            "status": "completed",
            "created_at": time.time()
        }

        runs[run_id] = record
        results.append(record)

    _save_runs(runs)
    return {"session_id": session_id, "runs": results}


def train_ensemble(
    dataset_id, model_ids, target_column, task_type,
    ensemble_method="voting", feature_selection=None
):
    X, y, n_features, n_samples, feature_names = _prepare_data(
        dataset_id, target_column, task_type, feature_selection
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    estimators = [
        (mid, MODEL_REGISTRY[mid]["cls"]())
        for mid in model_ids if mid in MODEL_REGISTRY
    ]

    start = time.time()

    if task_type == "classification":
        if ensemble_method == "stacking":
            model = StackingClassifier(
                estimators=estimators,
                final_estimator=LogisticRegression(),
                cv=5
            )
        else:
            model = VotingClassifier(estimators=estimators, voting="soft" if ensemble_method == "soft_voting" else "hard")
    else:
        if ensemble_method == "stacking":
            model = StackingRegressor(
                estimators=estimators,
                final_estimator=LinearRegression(),
                cv=5
            )
        else:
            model = VotingRegressor(estimators=estimators)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    metrics = {}
    artifacts = {}

    if task_type == "classification":
        metrics["accuracy"] = round(float(accuracy_score(y_test, y_pred)), 4)
        metrics["f1_score"] = round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
        metrics["precision"] = round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
        metrics["recall"] = round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4)
        artifacts["confusion_matrix"] = confusion_matrix(y_test, y_pred).tolist()
    else:
        metrics["rmse"] = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4)
        metrics["mae"] = round(float(mean_absolute_error(y_test, y_pred)), 4)
        metrics["r2_score"] = round(float(r2_score(y_test, y_pred)), 4)

    duration = round(time.time() - start, 2)
    run_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())

    model_names = [MODEL_REGISTRY[mid]["name"] for mid in model_ids if mid in MODEL_REGISTRY]
    record = {
        "id": run_id,
        "session_id": session_id,
        "dataset_id": dataset_id,
        "model_id": f"ensemble_{ensemble_method}",
        "model_name": f"Ensemble ({', '.join(model_names)})",
        "task_type": task_type,
        "target_column": target_column,
        "hyperparams": {"method": ensemble_method, "models": model_ids},
        "metrics": metrics,
        "artifacts": artifacts,
        "n_features": n_features,
        "n_samples": n_samples,
        "feature_names": feature_names,
        "feature_selection": feature_selection,
        "duration_seconds": duration,
        "status": "completed",
        "created_at": time.time()
    }

    runs = _load_runs()
    runs[run_id] = record
    _save_runs(runs)

    return {"session_id": session_id, "runs": [record]}


def get_ai_suggestions(dataset_id, target_column, task_type):
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    try:
        df = _load_dataset_df(dataset_id)
        df = df.dropna()
        n_samples = df.shape[0]
        n_features = df.shape[1] - 1
        target_unique = df[target_column].nunique() if target_column else 0

        prompt = f"""You are an expert ML advisor. A researcher has:
- Dataset: {dataset_id} ({n_samples} samples, {n_features} features)
- Task: {task_type}
- Target column: {target_column} ({target_unique} unique values)

Suggest exactly 3 models from this list that would work best and why:
logistic_regression, decision_tree_clf, random_forest_clf, gradient_boosting_clf, svm_clf, knn_clf, naive_bayes, extra_trees_clf, mlp_clf,
linear_regression, ridge, lasso, decision_tree_reg, random_forest_reg, gradient_boosting_reg, svm_reg, knn_reg, extra_trees_reg, mlp_reg

Return ONLY valid JSON, no markdown:
{{
  "suggestions": [
    {{"model_id": "random_forest_clf", "reason": "one sentence why"}},
    {{"model_id": "gradient_boosting_clf", "reason": "one sentence why"}},
    {{"model_id": "svm_clf", "reason": "one sentence why"}}
  ],
  "ensemble_tip": "one sentence tip about combining these models"
}}"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        raw = completion.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except Exception as e:
        return {
            "suggestions": [],
            "ensemble_tip": "",
            "error": str(e)
        }