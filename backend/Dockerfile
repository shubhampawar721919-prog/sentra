# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: final ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Render injects $PORT at runtime; fallback for local Docker runs
ENV PORT=5001
EXPOSE 5001

CMD ["node", "src/app.js"]
