from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    AdaBoostClassifier, ExtraTreesClassifier, ExtraTreesRegressor
)
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering


MODEL_REGISTRY = {
    # ── CLASSIFICATION ──
    "logistic_regression": {
        "name": "Logistic Regression",
        "task": "classification",
        "cls": LogisticRegression,
        "description": "Simple, interpretable linear classifier. Great baseline.",
        "params": {
            "C": {"type": "float", "default": 1.0, "min": 0.01, "max": 10.0},
            "max_iter": {"type": "int", "default": 1000, "min": 100, "max": 5000}
        }
    },
    "decision_tree_clf": {
        "name": "Decision Tree",
        "task": "classification",
        "cls": DecisionTreeClassifier,
        "description": "Interpretable tree-based classifier. Prone to overfitting.",
        "params": {
            "max_depth": {"type": "int", "default": 5, "min": 1, "max": 50},
            "min_samples_split": {"type": "int", "default": 2, "min": 2, "max": 20}
        }
    },
    "random_forest_clf": {
        "name": "Random Forest",
        "task": "classification",
        "cls": RandomForestClassifier,
        "description": "Ensemble of trees. Strong default performance.",
        "params": {
            "n_estimators": {"type": "int", "default": 100, "min": 10, "max": 500},
            "max_depth": {"type": "int", "default": 10, "min": 1, "max": 50}
        }
    },
    "gradient_boosting_clf": {
        "name": "Gradient Boosting",
        "task": "classification",
        "cls": GradientBoostingClassifier,
        "description": "Sequential boosted trees. Often top accuracy.",
        "params": {
            "n_estimators": {"type": "int", "default": 100, "min": 10, "max": 500},
            "learning_rate": {"type": "float", "default": 0.1, "min": 0.001, "max": 1.0}
        }
    },
    "svm_clf": {
        "name": "Support Vector Machine",
        "task": "classification",
        "cls": SVC,
        "description": "Effective for high-dimensional, complex boundaries.",
        "params": {
            "C": {"type": "float", "default": 1.0, "min": 0.01, "max": 10.0},
            "kernel": {"type": "select", "default": "rbf", "options": ["linear", "rbf", "poly"]}
        }
    },
    "knn_clf": {
        "name": "K-Nearest Neighbors",
        "task": "classification",
        "cls": KNeighborsClassifier,
        "description": "Instance-based, simple and intuitive.",
        "params": {
            "n_neighbors": {"type": "int", "default": 5, "min": 1, "max": 50}
        }
    },
    "naive_bayes": {
        "name": "Naive Bayes",
        "task": "classification",
        "cls": GaussianNB,
        "description": "Fast probabilistic classifier, works well on small data.",
        "params": {}
    },
    "adaboost_clf": {
        "name": "AdaBoost",
        "task": "classification",
        "cls": AdaBoostClassifier,
        "description": "Boosted weak learners, good for noisy data.",
        "params": {
            "n_estimators": {"type": "int", "default": 50, "min": 10, "max": 300}
        }
    },
    "extra_trees_clf": {
        "name": "Extra Trees",
        "task": "classification",
        "cls": ExtraTreesClassifier,
        "description": "Randomized trees, faster than Random Forest.",
        "params": {
            "n_estimators": {"type": "int", "default": 100, "min": 10, "max": 500}
        }
    },
    "mlp_clf": {
        "name": "Neural Network (MLP)",
        "task": "classification",
        "cls": MLPClassifier,
        "description": "Multi-layer perceptron. Flexible but needs more data.",
        "params": {
            "hidden_layer_sizes": {"type": "int", "default": 100, "min": 10, "max": 300},
            "max_iter": {"type": "int", "default": 500, "min": 100, "max": 2000}
        }
    },

    # ── REGRESSION ──
    "linear_regression": {
        "name": "Linear Regression",
        "task": "regression",
        "cls": LinearRegression,
        "description": "Simple baseline for continuous prediction.",
        "params": {}
    },
    "ridge": {
        "name": "Ridge Regression",
        "task": "regression",
        "cls": Ridge,
        "description": "Linear regression with L2 regularization.",
        "params": {
            "alpha": {"type": "float", "default": 1.0, "min": 0.01, "max": 10.0}
        }
    },
    "lasso": {
        "name": "Lasso Regression",
        "task": "regression",
        "cls": Lasso,
        "description": "Linear regression with L1 regularization, feature selection.",
        "params": {
            "alpha": {"type": "float", "default": 1.0, "min": 0.01, "max": 10.0}
        }
    },
    "decision_tree_reg": {
        "name": "Decision Tree",
        "task": "regression",
        "cls": DecisionTreeRegressor,
        "description": "Interpretable tree-based regressor.",
        "params": {
            "max_depth": {"type": "int", "default": 5, "min": 1, "max": 50}
        }
    },
    "random_forest_reg": {
        "name": "Random Forest",
        "task": "regression",
        "cls": RandomForestRegressor,
        "description": "Ensemble regressor, strong default performance.",
        "params": {
            "n_estimators": {"type": "int", "default": 100, "min": 10, "max": 500},
            "max_depth": {"type": "int", "default": 10, "min": 1, "max": 50}
        }
    },
    "gradient_boosting_reg": {
        "name": "Gradient Boosting",
        "task": "regression",
        "cls": GradientBoostingRegressor,
        "description": "Sequential boosted trees for regression.",
        "params": {
            "n_estimators": {"type": "int", "default": 100, "min": 10, "max": 500},
            "learning_rate": {"type": "float", "default": 0.1, "min": 0.001, "max": 1.0}
        }
    },
    "svm_reg": {
        "name": "Support Vector Regression",
        "task": "regression",
        "cls": SVR,
        "description": "SVM adapted for continuous prediction.",
        "params": {
            "C": {"type": "float", "default": 1.0, "min": 0.01, "max": 10.0},
            "kernel": {"type": "select", "default": "rbf", "options": ["linear", "rbf", "poly"]}
        }
    },
    "knn_reg": {
        "name": "K-Nearest Neighbors",
        "task": "regression",
        "cls": KNeighborsRegressor,
        "description": "Instance-based regression.",
        "params": {
            "n_neighbors": {"type": "int", "default": 5, "min": 1, "max": 50}
        }
    },
    "extra_trees_reg": {
        "name": "Extra Trees",
        "task": "regression",
        "cls": ExtraTreesRegressor,
        "description": "Randomized trees, faster than Random Forest.",
        "params": {
            "n_estimators": {"type": "int", "default": 100, "min": 10, "max": 500}
        }
    },
    "mlp_reg": {
        "name": "Neural Network (MLP)",
        "task": "regression",
        "cls": MLPRegressor,
        "description": "Multi-layer perceptron for regression.",
        "params": {
            "hidden_layer_sizes": {"type": "int", "default": 100, "min": 10, "max": 300},
            "max_iter": {"type": "int", "default": 500, "min": 100, "max": 2000}
        }
    },

    # ── CLUSTERING ──
    "kmeans": {
        "name": "K-Means",
        "task": "clustering",
        "cls": KMeans,
        "description": "Partition data into K clusters.",
        "params": {
            "n_clusters": {"type": "int", "default": 3, "min": 2, "max": 20}
        }
    },
    "dbscan": {
        "name": "DBSCAN",
        "task": "clustering",
        "cls": DBSCAN,
        "description": "Density-based clustering, finds arbitrary shapes.",
        "params": {
            "eps": {"type": "float", "default": 0.5, "min": 0.1, "max": 5.0},
            "min_samples": {"type": "int", "default": 5, "min": 2, "max": 50}
        }
    },
    "agglomerative": {
        "name": "Agglomerative Clustering",
        "task": "clustering",
        "cls": AgglomerativeClustering,
        "description": "Hierarchical clustering, builds nested clusters.",
        "params": {
            "n_clusters": {"type": "int", "default": 3, "min": 2, "max": 20}
        }
    },
}


def get_models_by_task(task_type: str = None):
    if task_type:
        return {k: v for k, v in MODEL_REGISTRY.items() if v["task"] == task_type}
    return MODEL_REGISTRY


def get_model_catalog_summary():
    catalog = []
    for key, meta in MODEL_REGISTRY.items():
        catalog.append({
            "id": key,
            "name": meta["name"],
            "task": meta["task"],
            "description": meta["description"],
            "params": meta["params"]
        })
    return catalog