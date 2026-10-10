from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.routes import api
from app.services.anomaly_service import load_anomaly_model, get_anomaly_model_status
from app.services.failure_prediction_service import load_failure_model, get_failure_model_status

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models on startup
    print("Loading ML models...")
    anomaly_loaded = load_anomaly_model()
    if anomaly_loaded:
        print("Anomaly model loaded successfully.")
    else:
        print("WARNING: Anomaly model not found. Run scripts/train_models.py")
        
    failure_loaded = load_failure_model()
    if failure_loaded:
        print("Failure model loaded successfully.")
    else:
        print("WARNING: Failure model not found. Run scripts/train_models.py")
        
    yield
    # Cleanup on shutdown (if any)
    print("Shutting down ML models...")

app = FastAPI(
    title="SENTRA ML API",
    description="AI-Based Sensor Trust, Drift and False-Alarm Detection Engine for SENTRA",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(api.router)

@app.get("/health")
def health_check():
    import os
    return {
        "status": "healthy",
        "models": {
            "anomaly": get_anomaly_model_status(),
            "failurePrediction": get_failure_model_status()
        },
        "groq": "configured" if os.getenv("GROQ_API_KEY") else "not configured"
    }

@app.get("/ping")
def ping():
    import time
    return {
        "status": "pong",
        "service": "ml-service",
        "timestamp": time.time(),
        "message": "Python FastAPI ML engine responsive"
    }

