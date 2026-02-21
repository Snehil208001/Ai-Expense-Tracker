# Root Dockerfile - for Railway when Root Directory = repo root (monorepo)
# Builds the backend from backend/
FROM node:20-slim

# Prisma requires OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src/

RUN npm run build
RUN mkdir -p uploads

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
