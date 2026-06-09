# Stage 1: install JS deps
FROM node:22-alpine AS node-deps
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Stage 2: build React app
FROM node:22-alpine AS node-builder
WORKDIR /app/frontend
COPY --from=node-deps /app/frontend/node_modules ./node_modules
COPY frontend/ .
RUN npm run build

# Stage 3: Python runtime
FROM python:3.12-slim AS runner
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=node-builder /app/frontend/dist ./static

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
