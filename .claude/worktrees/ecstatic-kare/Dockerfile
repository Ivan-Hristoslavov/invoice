FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /usr/src/app

# Copy package.json and related files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
# https://nextjs.org/docs/pages/api-reference/next-config-js/environment-variables
ENV NODE_ENV production

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /usr/src/app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/prisma ./prisma

# Copy over migration scripts
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/scripts ./scripts

# Set the correct permission for nextjs to access .next folder
RUN mkdir -p /usr/src/app/.next/cache/images && chown -R nextjs:nodejs /usr/src/app/.next

# Start the server
EXPOSE 3000
CMD ["npm", "start"] 