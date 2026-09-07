# ---- Frontend build stage ----
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Backend runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
# Serve the built frontend as static assets from the same Cloud Run service
COPY --from=frontend-build /app/frontend/dist ./public

# Cloud Run injects PORT at runtime; the app must read it, never hardcode it
ENV PORT=8080
EXPOSE 8080

# Run as non-root
RUN addgroup --system app && adduser --system --ingroup app app
USER app

CMD ["node", "src/server.js"]
