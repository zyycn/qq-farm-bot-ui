FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./

# Copy project package.json files
COPY apps/core/package.json ./apps/core/
COPY apps/web/package.json ./apps/web/

# Install all deps for build
RUN npm config set registry https://registry.npmmirror.com/
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/core ./apps/core
COPY apps/web ./apps/web

# Build web + core (NestJS)
RUN pnpm build

# ==========================================

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# Copy workspace config and node_modules for runtime
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy core dist, legacy, and package.json
COPY --from=builder /app/apps/core/dist ./apps/core/dist
COPY --from=builder /app/apps/core/legacy ./apps/core/legacy
COPY --from=builder /app/apps/core/package.json ./apps/core/

# Copy web assets
COPY --from=builder /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/core

EXPOSE 3000

CMD ["node", "dist/main.js"]
