# Stage 1: Build frontend
FROM node:18 AS frontend-build

WORKDIR /app/frontend
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY public/ public/
COPY src/ src/
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=/api
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps
RUN apk add --no-cache openssl openssl-dev
COPY backend/ ./
RUN npx prisma generate --schema=./prisma/schema.prisma

# Stage 3: Production image
FROM node:18-slim

RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    openssl \
    libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy frontend build
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

# Copy backend
WORKDIR /app/backend
COPY --from=backend-build /app/backend /app/backend

# Copy nginx configuration (will be overwritten by start.sh)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]

EXPOSE 80