FROM node:20-bookworm-slim

# Install Python 3, virtualenv, OpenMP (required by XGBoost), and build tools (for native Node addons like bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    libgomp1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Root dependencies (concurrently)
COPY package.json package-lock.json* ./
RUN npm install

# 2. Install Backend dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install

# 3. Install Frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

# 4. Install ML Python dependencies in virtual environment
COPY ml/requirements.txt ./ml/
RUN python3 -m venv /app/ml/venv && \
    /app/ml/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/ml/venv/bin/pip install --no-cache-dir -r ./ml/requirements.txt

# Put ML virtualenv on PATH so `python` and `uvicorn` resolve directly
ENV PATH="/app/ml/venv/bin:$PATH"

# 5. Copy all 3 service directories and startup script
COPY ml ./ml
COPY backend ./backend
COPY frontend ./frontend
COPY start.sh ./start.sh

# 6. Train/verify ML models inside the container environment
RUN cd /app/ml && python scripts/train_models.py

# 7. Build the Frontend production bundle (also served by Backend on Render's $PORT)
RUN cd /app/frontend && npm run build

RUN chmod +x /app/start.sh

# Render injects PORT (defaults to 10000)
ENV NODE_ENV=production
ENV PORT=10000
ENV ML_SERVICE_URL=http://127.0.0.1:8000

EXPOSE 10000 5001 5173 8000

CMD ["/app/start.sh"]
