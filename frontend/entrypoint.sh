#!/bin/sh
# Runs inside the nginx container before nginx starts.
# Writes a tiny config.js into the static root so the React app
# can read the real backend URL at runtime (set by Render as $API_URL).
set -e

STATIC_DIR=/usr/share/nginx/html
CONFIG_FILE="${STATIC_DIR}/config.js"

# API_URL is injected by Render at container start via envVars.fromService.
# Fall back to localhost for local docker-compose runs.
API_URL="${API_URL:-http://localhost:5001}"

echo "window.__POLARIS_API_URL__ = '${API_URL}';" > "${CONFIG_FILE}"
echo "[entrypoint] config.js written: API_URL=${API_URL}"

exec nginx -g 'daemon off;'
