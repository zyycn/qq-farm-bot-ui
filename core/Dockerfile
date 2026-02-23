FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./

# Copy project package.json files
COPY core/package.json ./core/
COPY web/package.json ./web/

# Install dependencies (frozen-lockfile is default for pnpm install in CI)
RUN pnpm install

# Copy source code
COPY core ./core
COPY web ./web

# Build web
RUN pnpm build:web

# ==========================================

FROM node:20-alpine AS runner

WORKDIR /app/core

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# Copy core source and dependencies
COPY --from=builder /app/core ./
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/package.json ../package.json

# Copy built web assets
COPY --from=builder /app/web/dist ../web/dist

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "client.js"]
