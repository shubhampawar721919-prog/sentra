# app/services/simulation_service.py

from app.services.anomaly_service import detect_anomaly
from app.services.failure_prediction_service import predict_failure
from app.services.risk_service import evaluate_overall_risk
from app.services.cascade_risk_service import calculate_cascade_risks
from copy import deepcopy

def run_simulation(asset_id: str, baseline_telemetry: dict, changes: dict) -> dict:
    """
    Runs a what-if simulation by applying changes to baseline telemetry,
    calculating risks for both baseline and simulation, and determining cascading effects.
    """
    
    # --- BASELINE ---
    baseline_anomaly = detect_anomaly(baseline_telemetry)
    baseline_failure = predict_failure(baseline_telemetry)
    baseline_risk = evaluate_overall_risk(baseline_anomaly, baseline_failure)
    
    # --- SIMULATION ---
    sim_telemetry = deepcopy(baseline_telemetry)
    for key, value in changes.items():
        if key in sim_telemetry:
            sim_telemetry[key] = value
            
    sim_anomaly = detect_anomaly(sim_telemetry)
    sim_failure = predict_failure(sim_telemetry)
    sim_risk = evaluate_overall_risk(sim_anomaly, sim_failure)
    
    # --- CASCADE EFFECTS ---
    # To calculate cascade, we feed the simulated risk into the cascade engine
    cascade_input = [
        {
            "assetId": asset_id,
            "failureProbability": sim_failure["probability"],
            "anomalyScore": sim_anomaly["score"],
            "criticality": "CRITICAL" # Assuming critical for MVP purposes
        }
    ]
    
    cascade_result = calculate_cascade_risks(cascade_input)
    
    # Risk increase
    risk_increase = sim_risk["score"] - baseline_risk["score"]
    
    return {
        "baseline": {
            "anomalyScore": baseline_anomaly["score"],
            "failureProbability": baseline_failure["probability"],
            "riskLevel": baseline_risk["level"]
        },
        "simulation": {
            "anomalyScore": sim_anomaly["score"],
            "failureProbability": sim_failure["probability"],
            "riskLevel": sim_risk["level"]
        },
        "change": {
            "riskIncrease": round(risk_increase, 2)
        },
        "cascade": cascade_result
    }
