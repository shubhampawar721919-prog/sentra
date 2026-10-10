#!/bin/sh
set -e

export PORT="${PORT:-10000}"
export ML_SERVICE_URL="${ML_SERVICE_URL:-http://127.0.0.1:8000}"

echo "Starting POLARIS unified container (Frontend + Backend + ML)..."
echo "Public Render HTTP/WebSocket port: ${PORT}"
echo "Internal FastAPI ML service URL:   ${ML_SERVICE_URL}"

exec npm start
