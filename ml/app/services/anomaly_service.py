import os
import joblib
import pandas as pd
from app.utils.feature_engineering import engineer_features

# Global variable to hold the loaded model
_model = None

def load_anomaly_model():
    global _model
    model_path = os.path.join(os.path.dirname(__file__), '../../trained_models/anomaly_model.joblib')
    if os.path.exists(model_path):
        _model = joblib.load(model_path)
        return True
    return False

def get_anomaly_model_status():
    return "loaded" if _model is not None else "not loaded"

def detect_anomaly(telemetry_dict: dict) -> dict:
    if _model is None:
        raise ValueError("Anomaly model is not loaded. Run scripts/train_models.py")

    # Convert to DataFrame for feature engineering
    df = pd.DataFrame([telemetry_dict])
    X = engineer_features(df)
    
    # Predict (-1 is anomaly, 1 is normal)
    prediction = _model.predict(X)[0]
    
    # Get anomaly score (lower is more anomalous, ranges from roughly -0.5 to 0.5)
    raw_score = _model.score_samples(X)[0]
    
    # Normalize score to a 0-1 range (1 being highly anomalous, 0 being perfectly normal)
    # Typically, normal scores are > -0.6, anomalies are < -0.6
    # Let's map [-1.0, -0.4] to [1.0, 0.0]
    normalized_score = min(1.0, max(0.0, (-0.4 - raw_score) / 0.6))
    
    detected = bool(prediction == -1)
    
    # Mathematically derived confidence based on distance from the decision boundary (0.5 normalized threshold)
    boundary_distance = abs(normalized_score - 0.5)
    confidence = round(min(0.99, max(0.65, 0.50 + boundary_distance * 0.98)), 2)
    
    # Base risk level from anomaly
    risk_level = "LOW"
    if detected:
        if normalized_score > 0.8:
            risk_level = "CRITICAL"
        elif normalized_score > 0.6:
            risk_level = "HIGH"
        else:
            risk_level = "MEDIUM"

    return {
        "detected": detected,
        "score": round(float(normalized_score), 2),
        "confidence": round(float(confidence), 2),
        "riskLevel": risk_level
    }
