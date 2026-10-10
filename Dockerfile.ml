# =============================================================================
# Polaris — ML Service (FastAPI + scikit-learn + XGBoost)
# Build context: repo root   (used by Render — dockerfilePath: ./Dockerfile.ml)
# For local dev use:  docker compose up --build
# =============================================================================

# ── Stage 1: build native wheels ─────────────────────────────────────────────
FROM python:3.10-slim AS builder
WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY ml/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

# ── Stage 2: lean runtime ─────────────────────────────────────────────────────
FROM python:3.10-slim AS runner
WORKDIR /app

# Bring in installed packages
COPY --from=builder /install /usr/local

# Copy only what the service needs
COPY ml/app/        ./app/
COPY ml/scripts/    ./scripts/
COPY ml/trained_models/ ./trained_models/

# Train models at image-build time so cold start is instant
RUN python scripts/train_models.py || true

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
