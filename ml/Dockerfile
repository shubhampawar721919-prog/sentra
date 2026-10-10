# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM python:3.10-slim AS builder
WORKDIR /app

# Install build tools for native wheels (scikit-learn, xgboost, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

# ── Stage 2: final ────────────────────────────────────────────────────────────
FROM python:3.10-slim AS runner
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY app/ ./app/
COPY trained_models/ ./trained_models/
COPY scripts/ ./scripts/

# Train models if not already present (Render will do this in the build step;
# this is a safety net for pure-Docker runs).
RUN python scripts/train_models.py || true

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
