# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**emploi** records a personal job search history:

- **Offers** the user applied to: link, title, description (plus the company).
- **Interview process** for each offer: a sequence of steps. Every company runs its process differently, so steps are **not a fixed pipeline**. Model them as an ordered, open-ended list attached to an application (e.g. phone screen → technical test → onsite → offer). Each step has its own type, date, status and notes. Don't hardcode a set of stages in the schema or the UI.

Implemented: offers (CRUD, ADR-0011): `back/src/offers`, `front/src/app/offers`. Not yet: interview steps.

## Architecture decisions (ADRs)

Design decisions are recorded as ADRs in `adrs/` (format and rules in `adrs/0001-record-architecture-decisions.md`). This file summarises the rules they lead to; the ADRs hold the reasoning.

- Read the relevant ADRs before changing anything they cover.
- A new design decision (new tool or library, data model change, infrastructure change) needs a new ADR, `adrs/NNNN-short-title.md` with the next number, written before or with the code.
- Never rewrite an accepted ADR. Write a new one and mark the old one as superseded in its status line. Update this file to match.

## Layout

Repository `emploi` is a pnpm workspace (`pnpm-workspace.yaml`):

- `back/`: NestJS 12 API, ES modules (relative imports end in `.js`), PostgreSQL through Prisma 7.
- `front/`: Next.js 16 app router, `src/` directory, React Compiler, `output: 'standalone'` for Docker. Next 16 differs from older versions: read `front/AGENTS.md` and the docs in `front/node_modules/next/dist/docs/` before writing front code.
- `shared/` (`@emploi/shared`): API request/response **types only**, no runtime code, no build step; always `import type` from it (ADR-0009).
- `e2e/`: Playwright browser tests against the deployed stack (ADR-0013).
- `k8s/`: k3d cluster config and the Kubernetes manifests (kustomize).
- `adrs/`: architecture decision records.

Use **pnpm** only (never npm/yarn) and commit `pnpm-lock.yaml`. TypeScript is pinned to `~6.0` because typescript-eslint doesn't support 7 yet. Prisma is pinned to 7.10.0 (npm's `latest` tag points to an 8.0 release candidate). `.pnpmfile.cjs` removes the optional `prisma`/`typescript` peer dependencies from `@prisma/client` so production images don't ship the Prisma CLI, Studio or TypeScript; the Dockerfiles copy it before installing.

## Commands

The root `Makefile` is the entry point for every common task (ADR-0007). Prefer `make <target>` over raw pnpm/kubectl commands. When you add a recurring workflow, add a target with a `## description` comment so `make help` lists it.

```sh
make help                  # list targets
make install               # pnpm install (also runs prisma generate)
make check                 # format-check + lint + typecheck + unit tests + e2e: must pass before a change is done
make lint | lint-fix | format | typecheck | test | test-e2e | build
make test-back T=health    # back unit tests filtered by path/name (vitest run <filter>)
make test-front T=page     # front tests filtered by path/name
make browser-install       # once per machine: Playwright's Chromium
make test-browser          # Playwright tests against https://emploi.localhost (cluster must be up)
make test-browser T=offers # filtered by file name; `make browser-report` opens the last report

make up                    # create cluster, secrets, certs, build+import images, deploy, apply migrations
make images deploy         # after code changes: rebuild, import and roll out the images
make status | logs APP=back|front|postgres
make cluster-stop | cluster-start | down   # down deletes the cluster and its data

make db-migrate NAME=<change>   # prisma migrate dev against the cluster database
make db-deploy | db-generate | db-studio
```

First-time setup: `cp .env.example .env` (cluster DB credentials, used by `make secrets`) and `cp back/.env.example back/.env` (for the Prisma CLI and running the API on the host). The `db-*` targets need the cluster running: they reach PostgreSQL at `localhost:54320` through a NodePort.

## Local environment: k3d, Traefik, HTTPS

| URL                            | Service |
| ------------------------------ | ------- |
| `https://emploi.localhost`     | `front` |
| `https://api.emploi.localhost` | `back`  |

- k3d cluster `emploi` (`k8s/k3d-cluster.yaml`), namespace `emploi`. Make targets always pass `--context k3d-emploi`; do the same in manual kubectl commands, since other clusters exist on this machine.
- Images `emploi-back:dev` and `emploi-front:dev` are built locally and loaded with `k3d image import` (`imagePullPolicy: Never`, no registry). Both Dockerfiles use the repo root as build context. Images take no build-time configuration.
- Traefik (shipped with k3s) routes the domains. `k8s/ingress.yaml` has two Ingresses: an HTTP one that only redirects to HTTPS, and an HTTPS one using the `emploi-tls` secret. A single Ingress can't do both, because a Traefik router with TLS only serves HTTPS.
- `make certs` generates the mkcert certificate into `.certs/` (not committed). `make secrets` creates the `emploi-db` secret from `.env`. Never put real values in committed manifests.
- `*.localhost` resolves to `::1` here; the k3d ports have no host IP so Docker publishes on IPv4 and IPv6.
- URLs come from runtime configuration, not code: `CORS_ORIGINS` (back ConfigMap in `k8s/back.yaml`), `API_URL` (front ConfigMap in `k8s/front.yaml`: `http://back`, the in-cluster service, because `*.localhost` resolves to the pod itself inside the cluster). The front ConfigMap also sets `TZ`, the time zone timestamps are displayed in.
- Pods run as non-root with a read-only root filesystem. `back` has readiness `/health/ready` (checks the database) and liveness `/health/live`.

## Back (NestJS) conventions

- Environment variables are validated at startup by `src/config/env.validation.ts` (class-validator). Add every new variable there, to `back/.env.example`, and to `k8s/back.yaml` (ConfigMap) or the secret.
- The global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) is registered as `APP_PIPE` in `AppModule`, not in `main.ts`, so e2e tests use it too. CORS and `x-powered-by` are configured in `main.ts`.
- One feature module per domain concept (e.g. applications, interview steps). Thin controllers, logic in services, DTOs for input and output. DTO classes implement the types from `@emploi/shared`. Never return Prisma models directly.
- Database access only through `PrismaService` (global `PrismaModule`, Prisma 7 driver adapter `@prisma/adapter-pg`), and only from services. The Prisma client is generated into `src/generated/prisma` (git-ignored); import it from `../generated/prisma/client.js`.
- Schema in `back/prisma/schema.prisma`, Prisma config in `back/prisma.config.ts`. Change the schema, then `make db-migrate NAME=…`; commit migrations and never edit applied ones. Prisma 7's `migrate dev` doesn't regenerate the client: the Make target runs `prisma generate` afterwards.
- Feature module shape (see `src/offers`): DTO classes in `dto/` implementing the shared request types, a `*.mapper.ts` turning Prisma rows into shared response types (dates as ISO strings, date-only columns as `YYYY-MM-DD`), a service that maps Prisma `P2025` to `NotFoundException`, and `ParseUUIDPipe` on `:id` params. Optional string inputs are trimmed and blank becomes `null` (`src/common/transforms.ts`); for `PATCH`, absent means unchanged and `null` clears.
- Tests use Vitest (ADR-0010): unit tests `src/**/*.spec.ts`, e2e tests `test/**/*.e2e-spec.ts` with Supertest. e2e tests boot `AppModule` with `PrismaService` overridden by a mock; their environment variables are set in `vitest.config.e2e.ts`.
- Under Vitest, properties without a type annotation get no decorator type metadata: use explicit `@Type(() => Number)` etc. for class-transformer conversions.

## Front (Next.js) conventions

- The browser never calls the API (ADR-0012). Pages are server components that read through `src/lib/api.ts`; mutations are server actions (`src/app/<feature>/actions.ts`) that validate input with Zod, call the API, then `revalidatePath` + `redirect`. Forms are client components using `useActionState` and get back the submitted values plus field/form errors.
- `src/lib/api.ts` is the only API client: server-only, no caching, and its read functions call `connection()` so pages render per request (otherwise `next build` would try to prerender them without an API). It throws `ApiError` (status + NestJS validation messages).
- Server env is validated with Zod in `src/lib/env.ts` (`serverEnv()`); add new variables there, to `front/.env.example` and to `k8s/front.yaml`. Running the front on the host against the cluster API needs `API_URL=https://api.emploi.localhost` and `NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"`.
- Field length limits are typed in `@emploi/shared` (`OfferFieldLimits`) and declared on each side with `satisfies`; keep the Zod schema in `src/lib/offer-form.ts` in line with the back DTOs.
- Validate external input (forms, query params such as `?page=`) on the front too. Server actions are reachable by direct POST: never trust their arguments.
- Tests: Vitest + Testing Library + jsdom, `src/**/*.test.{ts,tsx}` next to the code (`vitest.setup.ts` loads jest-dom matchers). `server-only` is aliased to a stub in `vitest.config.mts`; mock `next/navigation`, `next/cache` and `next/server` where needed. Async server component pages aren't unit-tested.
- `make typecheck` runs `next typegen` first so route types like `PageProps<'/offers/[id]'>` exist.

## Browser tests (Playwright)

- `e2e/` tests user flows in Chromium against the deployed cluster, not a dev server: after changing the UI or the API, run `make images deploy` then `make test-browser`. They are not part of `make check` (which works without a cluster).
- The cluster database holds real data: use the `offers` fixture (`e2e/fixtures/offers.ts`). It gives unique titles (`uniqueTitle`), creates data through the API (`create`), registers offers created through the UI (`track(page.url())`), and deletes everything after each test. Assert only on data the test created; never assume an empty database or a fixed count.
- Prefer role and label locators (`getByRole`, `getByLabel`) and web-first assertions (`await expect(locator)…`); `eslint-plugin-playwright` enforces the rest. Base URLs can be overridden with `E2E_BASE_URL` / `E2E_API_URL`.

## Code quality requirements

Best practices everywhere, checked by tools rather than by hand (ADR-0008). Work isn't done until `make check` passes.

- TypeScript strict mode plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Don't use `any`, `@ts-ignore` or non-null `!` to silence the compiler: fix the types.
- ESLint with typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` in every package (plus `eslint-config-next` in front), Prettier from the root config. Don't disable rules inline without a stated reason.
- If a check is missing for a package, add it rather than skipping it.
