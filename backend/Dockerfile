# Fly.io / Railway Dockerfile for AI Expense Tracker backend
FROM node:20-slim

# Prisma requires OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps including dev (needed for tsc build)
RUN npm install

# Generate Prisma client (no DB needed)
RUN npx prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# Create uploads dir
RUN mkdir -p uploads

# Run migrations then start (DATABASE_URL from Fly secrets at runtime)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
