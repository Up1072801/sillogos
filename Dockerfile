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
COPY backend/package.json ./
RUN npm install --legacy-peer-deps

COPY backend/ ./
RUN npx prisma generate

# Stage 3: Production image
FROM nginx:alpine

# Install Node.js and OpenSSL (χωρίς το libssl1.1)
RUN apk add --no-cache nodejs npm supervisor openssl

# Copy frontend build
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

# Copy backend
WORKDIR /app/backend
COPY --from=backend-build /app/backend /app/backend

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create supervisor configuration to run both nginx and node
RUN mkdir -p /etc/supervisor.d/
COPY supervisord.conf /etc/supervisor.d/supervisord.ini

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]