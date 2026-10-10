# app/services/cascade_risk_service.py

from app.services.dependency_service import (
    get_downstream_assets,
    get_criticality_weight,
    get_dependency_weight
)

def calculate_cascade_risks(assets_input: list) -> dict:
    """
    Calculates the cascading risk, direct risks, and overall station risk.
    assets_input is a list of dicts:
    [
        {
            "assetId": "DG-001",
            "failureProbability": 0.85,
            "anomalyScore": 0.72,
            "criticality": "CRITICAL"
        }, ...
    ]
    """
    
    # Track the direct risk of each asset based on inputs
    direct_risks = {}
    for asset in assets_input:
        asset_id = asset["assetId"]
        f_prob = asset.get("failureProbability", 0.0)
        a_score = asset.get("anomalyScore", 0.0)
        # Direct risk is a simple weighted sum (same as risk_service.py)
        direct_risk_score = (a_score * 0.4) + (f_prob * 0.6)
        direct_risks[asset_id] = {
            "assetId": asset_id,
            "score": direct_risk_score,
            "failureProbability": f_prob,
            "anomalyScore": a_score,
            "criticality": asset.get("criticality", "MEDIUM")
        }
        
    cascade_risks_list = []
    affected_assets = set()
    
    # Calculate cascades
    for asset_id, data in direct_risks.items():
        downstream = get_downstream_assets(asset_id)
        if downstream and data["failureProbability"] > 0.0:
            for child in downstream:
                dep_weight = get_dependency_weight(asset_id, child)
                # Derived dependency risk
                derived_risk = data["failureProbability"] * dep_weight
                
                if derived_risk > 0.1: # Threshold to report
                    level = "LOW"
                    if derived_risk > 0.6:
                        level = "HIGH"
                    elif derived_risk > 0.3:
                        level = "MEDIUM"
                        
                    cascade_risks_list.append({
                        "assetId": child,
                        "sourceAsset": asset_id,
                        "riskScore": round(derived_risk, 2),
                        "level": level,
                        "reason": f"{child} depends on {asset_id}."
                    })
                    affected_assets.add(child)
                    
    # Calculate overall station risk
    total_risk_weight = 0.0
    total_weighted_score = 0.0
    highest_risk_asset = None
    highest_risk_score = -1.0
    
    for asset_id, data in direct_risks.items():
        c_weight = get_criticality_weight(data["criticality"])
        total_weighted_score += data["score"] * c_weight
        total_risk_weight += c_weight
        
        if data["score"] > highest_risk_score:
            highest_risk_score = data["score"]
            highest_risk_asset = asset_id
            
    # Include cascade risks in the station risk calculation loosely
    for cascade in cascade_risks_list:
        # Give cascade risks a moderate generic weight for station risk
        c_weight = get_criticality_weight("MEDIUM") 
        total_weighted_score += cascade["riskScore"] * c_weight
        total_risk_weight += c_weight
        
    if total_risk_weight > 0:
        station_score = total_weighted_score / total_risk_weight
    else:
        station_score = 0.0
        
    station_level = "LOW"
    if station_score > 0.7:
        station_level = "CRITICAL"
    elif station_score > 0.5:
        station_level = "HIGH"
    elif station_score > 0.25:
        station_level = "MEDIUM"
        
    return {
        "stationRisk": {
            "score": round(station_score, 2),
            "level": station_level
        },
        "primaryRisk": highest_risk_asset,
        "directRisks": [{"assetId": k, "score": round(v["score"], 2)} for k, v in direct_risks.items()],
        "cascadeRisks": cascade_risks_list,
        "affectedAssets": list(affected_assets)
    }
