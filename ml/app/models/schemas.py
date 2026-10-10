from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TelemetryData(BaseModel):
    assetId: str
    temperature: float = 0.0
    vibration: float = 0.0
    powerOutput: float = 0.0
    generatorLoad: float = 0.0
    fuelLevel: float = 0.0
    coolantTemperature: float = 0.0
    batteryVoltage: float = 0.0

class AnomalyResult(BaseModel):
    detected: bool
    score: float
    confidence: float

class AnomalyResponse(BaseModel):
    assetId: str
    anomaly: AnomalyResult
    riskLevel: str

class FailurePredictionResult(BaseModel):
    probability: float
    confidence: float

class FailurePredictionResponse(BaseModel):
    assetId: str
    failurePrediction: FailurePredictionResult
    riskLevel: str

class RiskResult(BaseModel):
    level: str
    score: float

class RiskAnalysisResponse(BaseModel):
    assetId: str
    anomaly: AnomalyResult
    failurePrediction: FailurePredictionResult
    risk: RiskResult

class AIAnalysisRequest(BaseModel):
    assetId: str
    telemetry: dict
    anomaly: dict
    failurePrediction: dict
    risk: dict
    cascade: Optional[dict] = None
    decision: Optional[dict] = None

class AIAnalysisResponse(BaseModel):
    assetId: str
    analysis: str
    possibleCauses: List[str]
    recommendation: str

# Phase 5 additions
class AssetRiskInput(BaseModel):
    assetId: str
    failureProbability: float
    anomalyScore: float
    criticality: str

class CascadeRiskRequest(BaseModel):
    stationId: str
    assets: List[AssetRiskInput]

class SimulationRequest(BaseModel):
    assetId: str
    baseline: dict
    changes: dict

class UnifiedIntelligenceResponse(BaseModel):
    assetId: str
    telemetry: dict
    anomaly: dict
    failurePrediction: dict
    risk: dict
    cascade: dict
    decision: dict
