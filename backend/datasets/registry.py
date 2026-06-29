from sklearn.datasets import (
    load_iris, load_wine, load_breast_cancer,
    load_diabetes, fetch_california_housing
)

BUILTIN_DATASETS = {
    "iris": {
        "name": "Iris",
        "description": "Classic flower classification — 3 species, 4 features",
        "task_type": "classification",
        "loader": load_iris,
        "source": "sklearn"
    },
    "wine": {
        "name": "Wine",
        "description": "Wine cultivar classification from chemical analysis",
        "task_type": "classification",
        "loader": load_wine,
        "source": "sklearn"
    },
    "breast_cancer": {
        "name": "Breast Cancer Wisconsin",
        "description": "Binary classification — malignant vs benign tumors",
        "task_type": "classification",
        "loader": load_breast_cancer,
        "source": "sklearn"
    },
    "diabetes": {
        "name": "Diabetes",
        "description": "Regression — predict disease progression",
        "task_type": "regression",
        "loader": load_diabetes,
        "source": "sklearn"
    },
    "california_housing": {
        "name": "California Housing",
        "description": "Regression — predict median house value",
        "task_type": "regression",
        "loader": fetch_california_housing,
        "source": "sklearn"
    },
}

TOPIC_SUGGESTIONS = {
    "heart disease": ["heart-disease", "heart", "cleveland"],
    "plant disease": ["plant", "leaf", "crop"],
    "diabetes": ["diabetes", "pima"],
    "cancer": ["cancer", "breast-cancer"],
    "credit risk": ["credit", "loan", "bank"],
    "spam detection": ["spam", "email"],
    "sentiment analysis": ["sentiment", "review"],
    "image classification": ["mnist", "cifar"],
    "customer churn": ["churn", "telecom"],
    "fraud detection": ["fraud", "transaction"],
}