# Fly.io Dockerfile for AI Expense Tracker backend
FROM node:20-slim

WORKDIR /app

# Copy package files and prisma
COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (dev needed for tsc build)
RUN npm ci

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
