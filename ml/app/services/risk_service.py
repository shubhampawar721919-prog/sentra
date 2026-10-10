def evaluate_overall_risk(anomaly_result: dict, failure_result: dict) -> dict:
    """
    Combines anomaly detection and failure prediction into a unified risk score.
    """
    anomaly_detected = anomaly_result.get("detected", False)
    anomaly_score = anomaly_result.get("score", 0.0)
    failure_prob = failure_result.get("probability", 0.0)
    
    # Simple weighted score
    overall_score = (anomaly_score * 0.4) + (failure_prob * 0.6)
    
    level = "LOW"
    
    if anomaly_detected and failure_prob > 0.8:
        level = "CRITICAL"
    elif failure_prob > 0.6 or (anomaly_detected and failure_prob > 0.4):
        level = "HIGH"
    elif failure_prob > 0.3 or anomaly_detected:
        level = "MEDIUM"
        
    return {
        "level": level,
        "score": round(overall_score, 2)
    }
