#!/bin/sh
set -eu

if [ ! -f "node_modules/.package-lock.json" ] || [ "package-lock.json" -nt "node_modules/.package-lock.json" ]; then
  echo "Installing npm dependencies..."
  npm ci
fi

echo "Generating Prisma client..."
npx prisma generate

if [ -d "prisma/migrations" ] && [ "$(find prisma/migrations -mindepth 1 -maxdepth 1 | wc -l)" -gt 0 ]; then
  echo "Applying Prisma migrations..."
  npx prisma migrate deploy
else
  echo "No Prisma migrations found. Syncing schema with db push..."
  npx prisma db push
fi

echo "Starting Next.js dev server..."
exec npm run dev:next
