# syntax=docker/dockerfile:1
# Build context is the repository root: docker build -f back/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
RUN pnpm fetch
COPY shared shared
COPY back back
RUN pnpm install --offline --frozen-lockfile --filter back...
RUN pnpm --filter back build
# Production dependencies only; the Prisma client is already generated into dist.
RUN pnpm --filter back deploy --legacy --prod --ignore-scripts /out \
  && cp -r back/dist /out/dist

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/package.json ./
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
