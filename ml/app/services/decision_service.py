# app/services/decision_service.py

def generate_decision(asset_id: str, risk_score: float, anomaly_detected: bool, failure_prob: float, cascade_data: dict = None) -> dict:
    """
    Deterministically generates an operator priority and recommendation action.
    """
    
    # Priority Levels
    # risk < 0.25: LOW / MONITOR
    # 0.25 - 0.50: MEDIUM / INSPECT
    # 0.50 - 0.75: HIGH / ACTION REQUIRED
    # > 0.75: CRITICAL / URGENT
    
    priority = "LOW"
    action = f"Monitor {asset_id}."
    
    if risk_score > 0.75:
        priority = "URGENT"
        action = f"Inspect {asset_id} immediately."
    elif risk_score > 0.50:
        priority = "ACTION REQUIRED"
        action = f"Schedule maintenance for {asset_id} as soon as possible."
    elif risk_score > 0.25:
        priority = "INSPECT"
        action = f"Review {asset_id} telemetry for further degradation."
    else:
        priority = "MONITOR"
        
    reasons = []
    
    if anomaly_detected:
        reasons.append("Anomaly detected in telemetry baseline.")
    if failure_prob > 0.5:
        reasons.append("Failure probability is significantly elevated.")
        
    affected = []
    if cascade_data and "affectedAssets" in cascade_data:
        affected = cascade_data["affectedAssets"]
        if affected:
            reasons.append(f"Downstream systems depend on {asset_id}: {', '.join(affected)}.")
            
    if not reasons:
        reasons.append("Asset operating within normal parameters.")
        
    return {
        "priority": priority,
        "action": action,
        "reason": reasons,
        "affectedSystems": affected
    }
