#!/bin/bash

# Start Nginx in the background
nginx

# Change to the backend directory
cd /app/backend

# Deploy database migrations (creates tables based on schema)
npx prisma migrate deploy

# Run seed script to populate database with initial data
npx prisma db seed

# Start the Node.js backend
node server.js