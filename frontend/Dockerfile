# =============================================================================
# Polaris — Frontend (local docker compose only)
# Build context: ./frontend
# For Render deployment use Dockerfile.frontend at repo root instead.
# =============================================================================

# ── Stage 1: Vite build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# ── Stage 2: nginx static server ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
