#!/bin/sh
set -e

if [ "$(id -u)" -eq 0 ]; then
  mkdir -p /app/public/uploads /app/prisma /challenges /app/node_modules/prisma/engines
  chown -R nextjs:nodejs /app/public/uploads /app/prisma /challenges /app/node_modules/prisma
  exec su-exec nextjs "$@"
fi

exec "$@"
