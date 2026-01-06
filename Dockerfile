# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (including dev dependencies)
COPY package*.json ./
RUN npm ci

# Copy project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Remove dev dependencies for a leaner runtime image
RUN npm prune --omit=dev

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache su-exec

# Copy production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy built files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Ensure uploads and challenges directories exist
RUN mkdir -p public/uploads
RUN mkdir -p /challenges

# Copy other necessary files
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Create a non-root user and switch to it
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs --disabled-password --shell /sbin/nologin nextjs
RUN chown -R nextjs:nodejs /app/public /app/prisma /challenges

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV CHALLENGES_DIR=/challenges
ENV INGEST_CHALLENGES_AT_STARTUP=false

# Run with a root entrypoint to fix volume permissions, then drop to nextjs.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Initialize database and run the app
CMD ["sh", "-lc", "npx prisma migrate deploy && npx prisma db seed && npm start"]
