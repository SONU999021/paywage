#!/bin/sh
set -e
echo "=== PayWager API Docker entrypoint ==="
echo "PORT=${PORT:-8080}"
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi
echo "Running migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "Starting server..."
exec node dist/index.js
