FROM node:18

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "server.js"]