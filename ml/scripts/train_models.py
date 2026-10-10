import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import IsolationForest
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.utils.feature_engineering import engineer_features

def main():
    print("Loading synthetic telemetry...")
    df = pd.read_csv("data/raw/synthetic_telemetry.csv")
    
    print("Engineering features...")
    X = engineer_features(df)
    
    # Target variables
    # For Isolation Forest, we train mainly on NORMAL data to learn the baseline
    # For evaluation, we can define anomalies as those NOT normal
    y_anomaly_true = df['state_label'].apply(lambda x: 1 if x in ['FAILURE_PRECURSOR', 'WARNING'] else 0)
    
    # For XGBoost
    y_failure = df['failure_within_horizon']
    
    print("\n--- Training Isolation Forest (Anomaly Detection) ---")
    # Train only on normal operating data
    X_normal = X[df['state_label'] == 'NORMAL']
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    iso_forest.fit(X_normal)
    
    # Evaluate Isolation Forest
    # Predict returns 1 for normal, -1 for anomaly. Convert to 0 (normal), 1 (anomaly)
    iso_preds = iso_forest.predict(X)
    iso_preds_binary = [1 if p == -1 else 0 for p in iso_preds]
    
    print("Isolation Forest evaluation on full dataset (proxy against non-NORMAL states):")
    print(classification_report(y_anomaly_true, iso_preds_binary))
    
    print("\n--- Training XGBoost (Failure Prediction) ---")
    X_train, X_test, y_train, y_test = train_test_split(X, y_failure, test_size=0.2, random_state=42, stratify=y_failure)
    
    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train)
    
    xgb_preds = xgb_model.predict(X_test)
    print("XGBoost Evaluation (Test Set):")
    print("Accuracy: ", accuracy_score(y_test, xgb_preds))
    print("Precision:", precision_score(y_test, xgb_preds))
    print("Recall:   ", recall_score(y_test, xgb_preds))
    print("F1-Score: ", f1_score(y_test, xgb_preds))
    print("\nDetailed Report:\n", classification_report(y_test, xgb_preds))
    
    # Save Models
    print("\nSaving models...")
    os.makedirs("trained_models", exist_ok=True)
    joblib.dump(iso_forest, "trained_models/anomaly_model.joblib")
    joblib.dump(xgb_model, "trained_models/failure_model.joblib")
    
    print("Models saved successfully to trained_models/")

if __name__ == "__main__":
    main()
