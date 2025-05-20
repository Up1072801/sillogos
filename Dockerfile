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

# Install Node.js and correct OpenSSL version for Prisma
RUN apk add --no-cache nodejs npm supervisor openssl openssl-dev

# For Alpine Linux, ensure we install the correct OpenSSL libraries
RUN apk add --no-cache libssl1.1 || apk add --no-cache openssl

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

# Προσθέστε αυτή τη γραμμή μετά την αντιγραφή του supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Τροποποιήστε την εντολή CMD στο τέλος του Dockerfile
CMD ["/start.sh"]

EXPOSE 80 10000