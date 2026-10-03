# syntax=docker/dockerfile:1
# Build context is the repository root: docker build -f front/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
RUN pnpm fetch
COPY shared shared
COPY front front
RUN pnpm install --offline --frozen-lockfile --filter front...
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
  NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter front build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/front/.next/standalone ./
COPY --from=build --chown=node:node /repo/front/.next/static ./front/.next/static
COPY --from=build --chown=node:node /repo/front/public ./front/public
USER node
EXPOSE 3000
CMD ["node", "front/server.js"]
