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

# Expose port (helps some platforms detect it)
EXPOSE 3000

# Copy and use startup script (helps debug env on Railway)
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
