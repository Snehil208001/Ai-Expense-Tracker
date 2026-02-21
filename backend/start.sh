#!/bin/sh
set -e

# Railway sets PORT; default 3000
export PORT="${PORT:-3000}"
export NODE_ENV="${NODE_ENV:-production}"

echo "=== Starting expense-tracker-api ==="
echo "PORT=$PORT NODE_ENV=$NODE_ENV"
echo "DATABASE_URL set: $(test -n "$DATABASE_URL" && echo yes || echo NO)"
echo "JWT_SECRET set: $(test -n "$JWT_SECRET" && echo yes || echo NO)"

# Run migrations then start
npx prisma migrate deploy
echo "Migrations done, starting Node server on 0.0.0.0:$PORT..."
exec node dist/index.js
