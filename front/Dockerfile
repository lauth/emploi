# syntax=docker/dockerfile:1
# Build context is the repository root: docker build -f front/Dockerfile .

ARG NODE_IMAGE=node:26-alpine

FROM ${NODE_IMAGE} AS base
# Node 25+ no longer ships Corepack: install it, then it provides the pnpm
# version pinned in package.json (`packageManager`).
RUN npm install --global corepack@0.36.0 && corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
RUN pnpm fetch
COPY shared shared
COPY design-system design-system
COPY front front
RUN pnpm install --offline --frozen-lockfile --filter front...
# No build-time configuration: API_URL is read at runtime (adrs/0012-front-calls-api-from-server.md).
# The only build input is the Server Actions key, a BuildKit secret (not kept in
# the image history): with the same key, action ids stay the same from one build
# to the next, so pages opened before a deploy keep working
# (adrs/0023-stable-server-action-ids.md). `make images` passes it.
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=secret,id=next_actions_key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,required=true \
  pnpm --filter front build

FROM ${NODE_IMAGE} AS runtime
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
