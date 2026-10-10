# app/services/dependency_service.py

# A simple MVP dependency graph mapping parent assets to dependent downstream assets
ASSET_DEPENDENCIES = {
    # Bharati
    "FUEL-01": ["DG-001", "DG-002"],
    "DG-001": ["BAT-01", "BAT-02", "HVAC-01", "HVAC-02", "PUMP-01", "COM-01"],
    "DG-002": ["BAT-03", "HVAC-03", "PUMP-02"],
    "BAT-01": ["COM-01"],
    "BAT-02": ["HVAC-02"],
    "PUMP-01": ["DG-001"],
    
    # Maitri
    "MTR-FUEL-01": ["MTR-DG-01", "MTR-DG-02"],
    "MTR-DG-01": ["MTR-BAT-01", "MTR-HVAC-01", "MTR-PUMP-01"],
    "MTR-DG-02": ["MTR-BAT-01", "MTR-HVAC-01"],
    "MTR-BAT-01": ["MTR-HVAC-01"],

    # Maitri-II
    "M2-WIND-01": ["M2-BESS-01"],
    "M2-SOLAR-01": ["M2-BESS-01"],
    "M2-H2-01": ["M2-BESS-01"],
    "M2-BESS-01": ["M2-HVAC-01", "M2-PUMP-01", "M2-COM-01", "M2-LAB-01"],
    "M2-HVAC-01": ["M2-HAB-01"],
    "M2-PUMP-01": ["M2-HAB-01", "M2-LAB-01"]
}

# Criticality weights for the station-level risk calculation
CRITICALITY_WEIGHTS = {
    "LOW": 0.25,
    "MEDIUM": 0.50,
    "HIGH": 0.75,
    "CRITICAL": 1.00
}

def get_downstream_assets(asset_id: str) -> list:
    """Returns a list of assets that depend on the given asset_id."""
    return ASSET_DEPENDENCIES.get(asset_id, [])

def get_criticality_weight(criticality: str) -> float:
    """Returns the numeric weight for a given criticality string."""
    return CRITICALITY_WEIGHTS.get(criticality.upper(), 0.50)  # Default to MEDIUM

def get_dependency_weight(parent_asset: str, child_asset: str) -> float:
    """
    Returns a prototype dependency weight indicating how much of the parent's
    failure risk propagates to the child.
    """
    weights = {
        ("FUEL-01", "DG-001"): 0.80,
        ("FUEL-01", "DG-002"): 0.80,
        ("DG-001", "HVAC-01"): 0.90,
        ("DG-001", "HVAC-02"): 0.90,
        ("DG-001", "BAT-01"): 0.60,
        ("DG-001", "BAT-02"): 0.60,
        ("DG-001", "PUMP-01"): 0.85,
        ("DG-001", "COM-01"): 0.70,
        ("DG-002", "HVAC-03"): 0.90,
        ("DG-002", "BAT-03"): 0.60,
        ("DG-002", "PUMP-02"): 0.85,
        ("BAT-01", "COM-01"): 0.50
    }
    return weights.get((parent_asset, child_asset), 0.50)
