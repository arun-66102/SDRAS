"""
Predictive Analytics Engine — ML Model Training & Prediction
=============================================================
Module ④ in the workflow.

Trains three models for each of the four target variables:
  • XGBoost Regressor    (Gradient Boosting)
  • Random Forest        (Ensemble Trees)
  • Linear Regression    (Baseline Model)

Prediction Targets:
  • food_required     — f(population, severity, disaster_type, duration, rainfall)
  • medical_required  — f(population, severity, disaster_type, temperature)
  • water_required    — f(population, severity, disaster_type, duration, rainfall)
  • clothing_required — f(population, severity, disaster_type, duration)
"""
import os
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

try:
    from xgboost import XGBRegressor
except ImportError:
    XGBRegressor = None
    print("[WARN] XGBoost not installed, falling back to sklearn GradientBoosting")
    from sklearn.ensemble import GradientBoostingRegressor as XGBRegressor

from config import Config

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
FEATURE_COLS = [
    "disaster_type_encoded",
    "severity",
    "population_affected",
    "rainfall_mm",
    "temperature_c",
    "disaster_duration_days",
    "pop_severity",          # interaction feature
    "severity_duration",     # interaction feature
]
TARGET_COLS = ["food_required", "medical_required", "water_required", "clothing_required"]
MODEL_NAMES = ["xgboost", "random_forest", "linear_regression"]


# ─────────────────────────────────────────────────────────────────────────────
# DATA PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────
_label_encoder = LabelEncoder()


def preprocess_data(df):
    """
    Preprocess the dataset:
      1. Label-encode disaster_type
      2. Create interaction features
      3. Return features (X) and targets (y)
    """
    data = df.copy()

    # Label encode disaster type
    data["disaster_type_encoded"] = _label_encoder.fit_transform(data["disaster_type"])

    # Feature engineering — interaction terms
    data["pop_severity"] = data["population_affected"] * data["severity"]
    data["severity_duration"] = data["severity"] * data["disaster_duration_days"]

    X = data[FEATURE_COLS].values
    y = data[TARGET_COLS].values

    return X, y


def preprocess_single(disaster_type, severity, population_affected,
                       rainfall_mm, temperature_c, disaster_duration_days):
    """
    Preprocess a single input for prediction.
    Returns feature array of shape (1, n_features).
    """
    dtype_encoded = _label_encoder.transform([disaster_type])[0]
    pop_severity = population_affected * severity
    severity_duration = severity * disaster_duration_days

    features = np.array([[
        dtype_encoded,
        severity,
        population_affected,
        rainfall_mm,
        temperature_c,
        disaster_duration_days,
        pop_severity,
        severity_duration,
    ]])
    return features


# ─────────────────────────────────────────────────────────────────────────────
# MODEL TRAINING
# ─────────────────────────────────────────────────────────────────────────────
class DisasterMLEngine:
    """
    Manages training, evaluation, and prediction for all 3 models × 4 targets.
    Total of 12 sub-models.
    """

    def __init__(self):
        self.models = {}       # {model_name: {target_name: fitted_model}}
        self.metrics = {}      # {model_name: {target_name: {mae, rmse, r2}}}
        self.is_trained = False

    def train(self, csv_path=None):
        """Train all models from CSV data."""
        csv_path = csv_path or Config.DATASET_PATH
        print(f"\n{'='*60}")
        print("  ML Engine -- Training Pipeline")
        print(f"{'='*60}")

        # Load data
        df = pd.read_csv(csv_path)
        print(f"  Dataset loaded: {df.shape[0]} rows × {df.shape[1]} columns")

        # Preprocess
        X, y = preprocess_data(df)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=Config.TEST_SIZE, random_state=Config.RANDOM_STATE
        )
        print(f"  Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows\n")

        # Define models
        xgb_params = {
            "n_estimators": 200,
            "max_depth": 6,
            "learning_rate": 0.1,
            "random_state": Config.RANDOM_STATE,
        }
        if XGBRegressor.__name__ == "GradientBoostingRegressor":
            xgb_params["verbose"] = 0
        else:
            xgb_params["verbosity"] = 0

        model_factories = {
            "xgboost": lambda: XGBRegressor(**xgb_params),
            "random_forest": lambda: RandomForestRegressor(
                n_estimators=80,
                max_depth=8,
                random_state=Config.RANDOM_STATE,
                n_jobs=-1,
            ),
            "linear_regression": lambda: LinearRegression(),
        }

        # Train each model for each target
        for model_name, factory in model_factories.items():
            self.models[model_name] = {}
            self.metrics[model_name] = {}
            print(f"  -- {model_name.upper()} {'-'*(45-len(model_name))}")

            for i, target in enumerate(TARGET_COLS):
                model = factory()
                model.fit(X_train, y_train[:, i])
                y_pred = model.predict(X_test)

                mae = mean_absolute_error(y_test[:, i], y_pred)
                rmse = np.sqrt(mean_squared_error(y_test[:, i], y_pred))
                r2 = r2_score(y_test[:, i], y_pred)

                self.models[model_name][target] = model
                self.metrics[model_name][target] = {
                    "mae": round(mae, 2),
                    "rmse": round(rmse, 2),
                    "r2": round(r2, 4),
                }
                print(f"    {target:<22} MAE={mae:>10,.0f}  RMSE={rmse:>10,.0f}  R²={r2:.4f}")

            print()

        self.is_trained = True
        self._save_models()
        print(f"{'='*60}")
        print("  [OK] All models trained and saved successfully")
        print(f"{'='*60}\n")

    def _save_models(self):
        """Persist trained models and the label encoder to disk."""
        os.makedirs(Config.MODEL_DIR, exist_ok=True)

        for model_name in MODEL_NAMES:
            for target in TARGET_COLS:
                path = os.path.join(Config.MODEL_DIR, f"{model_name}_{target}.pkl")
                joblib.dump(self.models[model_name][target], path)

        # Save the label encoder
        joblib.dump(_label_encoder, os.path.join(Config.MODEL_DIR, "label_encoder.pkl"))
        # Save metrics
        joblib.dump(self.metrics, os.path.join(Config.MODEL_DIR, "metrics.pkl"))

    def load_models(self):
        """Load pre-trained models from disk."""
        global _label_encoder

        encoder_path = os.path.join(Config.MODEL_DIR, "label_encoder.pkl")
        if not os.path.exists(encoder_path):
            print("[ML] No saved models found. Training from scratch...")
            self.train()
            return

        _label_encoder = joblib.load(encoder_path)

        for model_name in MODEL_NAMES:
            self.models[model_name] = {}
            for target in TARGET_COLS:
                path = os.path.join(Config.MODEL_DIR, f"{model_name}_{target}.pkl")
                if os.path.exists(path):
                    self.models[model_name][target] = joblib.load(path)

        metrics_path = os.path.join(Config.MODEL_DIR, "metrics.pkl")
        if os.path.exists(metrics_path):
            self.metrics = joblib.load(metrics_path)

        self.is_trained = True
        print("[ML] Models loaded from disk successfully.")

    def predict(self, disaster_type, severity, population_affected,
                rainfall_mm, temperature_c, disaster_duration_days,
                model_name=None):
        """
        Predict resource requirements.

        Parameters
        ----------
        model_name : str or None
            If None, returns predictions from all 3 models.

        Returns
        -------
        dict — {model_name: {food_required, medical_required, water_required, clothing_required}}
        """
        if not self.is_trained:
            raise RuntimeError("Models not trained. Call train() or load_models() first.")

        features = preprocess_single(
            disaster_type, severity, population_affected,
            rainfall_mm, temperature_c, disaster_duration_days
        )

        models_to_use = [model_name] if model_name else MODEL_NAMES
        results = {}

        for m_name in models_to_use:
            preds = {}
            for target in TARGET_COLS:
                raw_pred = self.models[m_name][target].predict(features)[0]
                preds[target] = max(0, int(round(raw_pred)))
            results[m_name] = preds

        return results

    def get_best_model(self, target="food_required"):
        """Return the model name with the best R² for a given target."""
        if not self.metrics:
            return "xgboost"

        best_name = None
        best_r2 = -float("inf")
        for model_name, targets in self.metrics.items():
            if target in targets and targets[target]["r2"] > best_r2:
                best_r2 = targets[target]["r2"]
                best_name = model_name
        return best_name

    def get_all_metrics(self):
        """Return evaluation metrics for all models."""
        return self.metrics


# ─────────────────────────────────────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────────────────────────────────────
ml_engine = DisasterMLEngine()


# ─────────────────────────────────────────────────────────────────────────────
# STANDALONE EXECUTION (for training & evaluation)
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ml_engine.train()
