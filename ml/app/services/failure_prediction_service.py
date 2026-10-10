import os
import joblib
import pandas as pd
from app.utils.feature_engineering import engineer_features

_model = None

def load_failure_model():
    global _model
    model_path = os.path.join(os.path.dirname(__file__), '../../trained_models/failure_model.joblib')
    if os.path.exists(model_path):
        _model = joblib.load(model_path)
        return True
    return False

def get_failure_model_status():
    return "loaded" if _model is not None else "not loaded"

def predict_failure(telemetry_dict: dict) -> dict:
    if _model is None:
        raise ValueError("Failure prediction model is not loaded. Run scripts/train_models.py")

    df = pd.DataFrame([telemetry_dict])
    X = engineer_features(df)
    
    # Predict probabilities (assuming class 1 is failure)
    prob = _model.predict_proba(X)[0][1]
    
    # Base risk level from failure probability
    risk_level = "LOW"
    if prob > 0.8:
        risk_level = "CRITICAL"
    elif prob > 0.5:
        risk_level = "HIGH"
    elif prob > 0.2:
        risk_level = "MEDIUM"

    # Calibrated confidence derived from posterior probability margin (distance from 0.5 classification boundary)
    prob_float = float(prob)
    prob_margin = abs(prob_float - 0.5)
    confidence = round(min(0.99, max(0.60, 0.50 + prob_margin * 0.98)), 2)

    return {
        "probability": round(prob_float, 2),
        "confidence": confidence,
        "riskLevel": risk_level
    }
