# --- Stage 1: Build the React SPA Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Copy package descriptors and install dependencies
COPY client/package*.json ./
RUN npm install

# Copy source and build static output to client/dist
COPY client/ ./
RUN npm run build

# --- Stage 2: Setup Python FastAPI Backend ---
FROM python:3.10-slim AS backend-runner
WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend packages
COPY server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY server/ ./server/

# Copy compiled React frontend assets from Stage 1 into client/dist
COPY --from=frontend-builder /app/client/dist ./client/dist

# Expose backend port
EXPOSE 5000

# Define env defaults
ENV PORT=5000
ENV NODE_ENV=production

# Start Uvicorn backend server
CMD ["sh", "-c", "uvicorn server.main:app --host 0.0.0.0 --port ${PORT}"]
