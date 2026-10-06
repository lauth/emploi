# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**emploi** records a personal job search history:

- **Offers** the user applied to: link, title, description (plus the company).
- **Interview process** for each offer: a sequence of steps. Every company runs its process differently, so steps are **not a fixed pipeline**. Model them as an ordered, open-ended list attached to an application (e.g. phone screen → technical test → onsite → offer). Each step has its own type, date, status and notes. Don't hardcode a set of stages in the schema or the UI.

Implemented:

- Offers (CRUD, ADR-0011; only the title is required, ADR-0014): `back/src/offers`, `front/src/app/offers`.
- Offer list filters, sorting and pagination (ADR-0020): `GET /offers?q=&appliedFrom=&appliedTo=&sort=&order=&limit=&offset=`, most recent application first by default, missing values last. The front keeps the list state in the URL (`src/lib/offer-list-query.ts`: `?q=…&sort=title-asc&page=2&size=50`, invalid values fall back to defaults) and filters with a `next/form` GET form (`src/app/offers/offer-filters.tsx`).
- Interview steps (ADR-0015): nested resource `/offers/:offerId/steps` with a `PUT …/order` to reorder; `back/src/interview-steps`, shown on the offer page (`front/src/app/offers/[id]/interview-steps.tsx`, forms and actions in `front/src/app/offers/[id]/steps`).

Not yet: an overall status per offer derived from its steps.

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
- `design-system/` (`@emploi/design-system`): design tokens, base styles and the basic React components, presented in Storybook (ADR-0017). No build step: Next compiles it (`transpilePackages`).
- `mcp/` (`@emploi/mcp`): MCP server giving AI clients tools over the REST API, stdio only (ADR-0019). No build step: Node runs its TypeScript directly.
- `e2e/`: Playwright browser tests against the deployed stack (ADR-0013).
- `k8s/`: k3d cluster config and the Kubernetes manifests (kustomize).
- `adrs/`: architecture decision records.

Use **pnpm** only (never npm/yarn) and commit `pnpm-lock.yaml`. Node 26 everywhere: locally (`.nvmrc`, `engines`), in the Docker images, and `@types/node` ^26. TypeScript is pinned to `~6.0` because typescript-eslint doesn't support 7 yet. Prisma is pinned to 7.10.0 (npm's `latest` tag points to an 8.0 release candidate). `.pnpmfile.cjs` removes the optional `prisma`/`typescript` peer dependencies from `@prisma/client` so production images don't ship the Prisma CLI, Studio or TypeScript; the Dockerfiles copy it before installing.

## Commands

The root `Makefile` is the entry point for every common task (ADR-0007). Prefer `make <target>` over raw pnpm/kubectl commands. When you add a recurring workflow, add a target with a `## description` comment so `make help` lists it.

```sh
make help                  # list targets
make install               # pnpm install (also runs prisma generate)
make check                 # format-check + lint + typecheck + unit tests + e2e: must pass before a change is done
make lint | lint-fix | format | typecheck | test | test-e2e | build
make test-back T=health    # back unit tests filtered by path/name (vitest run <filter>)
make test-front T=page     # front tests filtered by path/name
make openapi               # regenerate back/openapi.json after an API change
make mcp                   # MCP server over stdio (started by AI clients through .mcp.json)
make storybook             # design system components on http://localhost:6006
make storybook-build       # static Storybook in design-system/storybook-static
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

| URL                                 | Service                                       |
| ----------------------------------- | --------------------------------------------- |
| `https://emploi.localhost`          | `front`                                       |
| `https://api.emploi.localhost`      | `back`                                        |
| `https://api.emploi.localhost/docs` | Swagger UI (OpenAPI document at `/docs-json`) |

- The host needs the `br_netfilter` kernel module (loaded at boot through `/etc/modules-load.d/br_netfilter.conf`). Without it, pods reach each other by IP but Services and cluster DNS silently time out (back "Database unreachable", front crash-looping). `make host-check` detects it, and `cluster-create`, `cluster-start` and `deploy` run it first.
- k3d cluster `emploi` (`k8s/k3d-cluster.yaml`), namespace `emploi`. Make targets always pass `--context k3d-emploi`; do the same in manual kubectl commands, since other clusters exist on this machine.
- Images `emploi-back:dev` and `emploi-front:dev` are built locally and loaded with `k3d image import` (`imagePullPolicy: Never`, no registry). Both Dockerfiles use the repo root as build context. Images take no build-time configuration. They run Node 26 (`NODE_IMAGE` build argument, `node:26-alpine`); Node 25+ no longer ships Corepack, so the Dockerfiles install it from npm, and it provides the pnpm version of `packageManager`.
- Traefik (shipped with k3s) routes the domains. `k8s/ingress.yaml` has two Ingresses: an HTTP one that only redirects to HTTPS, and an HTTPS one using the `emploi-tls` secret. A single Ingress can't do both, because a Traefik router with TLS only serves HTTPS.
- `make certs` generates the mkcert certificate into `.certs/` (not committed). `make secrets` creates the `emploi-db` secret from `.env`. Never put real values in committed manifests.
- `*.localhost` resolves to `::1` here; the k3d ports have no host IP so Docker publishes on IPv4 and IPv6.
- URLs come from runtime configuration, not code: `CORS_ORIGINS` (back ConfigMap in `k8s/back.yaml`), `API_URL` (front ConfigMap in `k8s/front.yaml`: `http://back`, the in-cluster service, because `*.localhost` resolves to the pod itself inside the cluster). The front ConfigMap also sets `TZ`, the time zone timestamps are displayed in.
- Rollouts have no downtime: `maxUnavailable: 0` plus a 5 s `preStop` sleep so Traefik stops routing to a pod before it exits. Keep both on new Deployments, otherwise requests right after `make deploy` (including browser tests) get 502s.
- `make deploy` only returns once the old pods are gone. Until then the old version still answers (keep-alive connections from the front stay pinned to the old back pod, and Next.js server action ids change with every build), so tests run earlier would hit a mix of versions.
- Pods run as non-root with a read-only root filesystem. `back` has readiness `/health/ready` (checks the database) and liveness `/health/live`.

## Back (NestJS) conventions

- Environment variables are validated at startup by `src/config/env.validation.ts` (class-validator). Add every new variable there, to `back/.env.example`, and to `k8s/back.yaml` (ConfigMap) or the secret.
- The global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) is registered as `APP_PIPE` in `AppModule`, not in `main.ts`, so e2e tests use it too. CORS and `x-powered-by` are configured in `main.ts`.
- One feature module per domain concept (e.g. applications, interview steps). Thin controllers, logic in services, DTOs for input and output. DTO classes implement the types from `@emploi/shared`. Never return Prisma models directly.
- Database access only through `PrismaService` (global `PrismaModule`, Prisma 7 driver adapter `@prisma/adapter-pg`), and only from services. The Prisma client is generated into `src/generated/prisma` (git-ignored); import it from `../generated/prisma/client.js`.
- Schema in `back/prisma/schema.prisma`, Prisma config in `back/prisma.config.ts`. Change the schema, then `make db-migrate NAME=…`; commit migrations and never edit applied ones. Prisma 7's `migrate dev` doesn't regenerate the client: the Make target runs `prisma generate` afterwards.
- Feature module shape (see `src/offers`, `src/interview-steps`): DTO classes in `dto/` implementing the shared request types, a `*.mapper.ts` turning Prisma rows into shared response types (dates as ISO strings, date-only columns as `YYYY-MM-DD`), a service that maps Prisma `P2025` to `NotFoundException`, and `ParseUUIDPipe` on id params. Optional string inputs are trimmed and blank becomes `null` (`src/common/transforms.ts`); for `PATCH`, absent means unchanged and `null` clears; fields that can be omitted but never cleared use `@IfPresent()` (`src/common/validators.ts`), not `@IsOptional()`, which lets `null` through.
- Nested resources check their parent: a child looked up, updated or deleted with `where: { id, offerId }` answers 404 when it belongs to another parent.
- **The API is documented with OpenAPI (ADR-0018).** Every endpoint gets `@ApiTags` (controller), `@ApiOperation({ summary })`, its success response with a type, `@ApiInvalidRequest()` when it takes input and `@ApiNotFound(…)` when it can 404 (`src/common/api-docs.ts`); id params get `ApiParam({ format: 'uuid' })`. Request DTOs carry `@ApiProperty`/`@ApiPropertyOptional` next to their validators, response shapes are `*Dto` classes implementing the shared types; field descriptions live once per feature (`offer-api-properties.ts`, `interview-step-api-properties.ts`). Give an explicit `type` for nullable, union or unannotated properties (no type metadata). Explicit decorators only, no Nest CLI Swagger plugin. After an API change run `make openapi` and commit `back/openapi.json`: `test/openapi.e2e-spec.ts` fails when it's stale, and also checks every route is documented.
- Text columns that are sorted (`offers.title`, `offers.company`) use the ICU collation `und-x-icu`, set by hand in their migration: the default libc collation on Alpine sorts capitals first and accents after `z`, and Prisma can't express collations (it doesn't track them either, so no drift). A new sortable text column needs the same `ALTER COLUMN … COLLATE "und-x-icu"` in its migration.
- Enums shared with the front (e.g. `InterviewStepStatus`, `OfferSortField`, `SortOrder`) are union types in `@emploi/shared`; each side builds its runtime list from a `Record<Status, …>` so a new value breaks the build until it is handled. The Prisma enum uses the same lowercase values.
- In tests with mocked Prisma, reset mocks with `vi.resetAllMocks()`: `vi.clearAllMocks()` keeps mocked results, which leak into the next test.
- Tests use Vitest (ADR-0010): unit tests `src/**/*.spec.ts`, e2e tests `test/**/*.e2e-spec.ts` with Supertest. e2e tests boot `AppModule` with `PrismaService` overridden by a mock; their environment variables are set in `vitest.config.e2e.ts`.
- Under Vitest, properties without a type annotation get no decorator type metadata: use explicit `@Type(() => Number)` etc. for class-transformer conversions.

## Front (Next.js) conventions

- **The interface is translated (ADR-0016), French only for now.** Never hardcode user-facing text: add it to `front/messages/fr.json` (the reference catalogue; keys are type-checked) and read it with `getTranslations` (server components, actions, `generateMetadata`) or `useTranslations` (client components). `react/jsx-no-literals` fails the lint on text in JSX; text in props (labels passed as props, placeholders, `aria-label`, confirm messages) isn't caught, so check it yourself. Code, comments, ADRs and API messages stay in English.
- Dates go through next-intl's formatter with the named formats of `src/i18n/formats.ts`: `formatDate(format, …)` for `YYYY-MM-DD` values, `formatDateTime(format, …)` for timestamps (`src/lib/format.ts`). Page titles only give their own part; the layout's template adds "· emploi".
- Validation messages are keys of the `validation` namespace, produced by the schema helpers of `src/lib/forms.ts` and translated by server actions with `validationTranslator()` (`src/lib/action-helpers.ts`). API error messages are never shown: `saveErrorMessages()` logs them and returns a translated message.
- The locale is resolved in `src/i18n/request.ts` (always `fr`; no locale in URLs). Adding a language: a new catalogue, the locale in `src/i18n/config.ts`, and an ADR for how it is chosen.

- The browser never calls the API (ADR-0012). Pages are server components that read through `src/lib/api.ts`; mutations are server actions (`src/app/<feature>/actions.ts`) that validate input with Zod, call the API, then `revalidatePath` + `redirect`. Forms are client components using `useActionState` and get back the submitted values plus field/form errors.
- `src/lib/api.ts` is the only API client: server-only, no caching, and its read functions call `connection()` so pages render per request (otherwise `next build` would try to prerender them without an API). It throws `ApiError` (status + NestJS validation messages).
- Server env is validated with Zod in `src/lib/env.ts` (`serverEnv()`); add new variables there, to `front/.env.example` and to `k8s/front.yaml`. Running the front on the host against the cluster API needs `API_URL=https://api.emploi.localhost` and `NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"`.
- Field length limits are typed in `@emploi/shared` (`OfferFieldLimits`, `InterviewStepFieldLimits`) and declared on each side with `satisfies`; keep the Zod schemas (`src/lib/offer-form.ts`, `src/lib/interview-step-form.ts`) in line with the back DTOs. Build new forms from `src/lib/forms.ts` (form state, `readForm`, `parseForm`, schema helpers) , design system fields with `error={fieldError(state, field)}`, and `src/app/offers/form-parts.tsx` (`FormErrors`, `FormActions`); use `ConfirmButton` for destructive actions.
- Validate external input (forms, query params such as `?page=`) on the front too. Server actions are reachable by direct POST: never trust their arguments.
- Tests: Vitest + Testing Library + jsdom, `src/**/*.test.{ts,tsx}` next to the code (`vitest.setup.ts` loads jest-dom matchers). `server-only` is aliased to a stub in `vitest.config.mts`; mock `next/navigation`, `next/cache` and `next/server` where needed. Async server component pages aren't unit-tested. Tests use the real French catalogue: render components with `renderWithIntl` (`src/test/intl.tsx`); `next-intl/server` is mocked globally in `vitest.setup.ts` with the same catalogue, so assertions are on French text.
- `make typecheck` runs `next typegen` first so route types like `PageProps<'/offers/[id]'>` exist.

## Design system (`design-system/`)

- The front builds its UI from `@emploi/design-system`: `Button` (and `buttonClassName()` to style a Next `Link` as a button), `TextField`, `TextAreaField`, `SelectField`, `Badge`, `Card`, `Alert`, `DescriptionList`. Front CSS modules only lay out pages (grids, spacing); don't restyle components there. A missing basic element becomes a design system component first.
- Styles use the tokens of `src/styles/tokens.css` (`--color-*`, `--space-*`, `--font-*`, `--radius-*`), never raw values; light and dark themes follow `prefers-color-scheme`. The app imports `@emploi/design-system/styles.css` once, in the root layout.
- Components are presentational: React and CSS Modules only, no Next.js, no data, **no text** (everything through props, so the front translates it; `react/jsx-no-literals` enforces it). Fields always have a visible label and wire `aria-invalid` / `aria-describedby` to their hint and error.
- Each component has stories (`*.stories.tsx`: every variant and state, `play` functions for behaviour) and, for logic, unit tests (`*.test.tsx`). `src/stories.test.tsx` runs every story as a Vitest test, with axe accessibility checks that fail on violations, so `make check` covers Storybook too.
- Linted with `eslint-plugin-jsx-a11y` (strict), React, hooks and Storybook rules.

## MCP server (`mcp/`)

- Gives AI clients tools over the REST API (ADR-0019): `list_offers`, `get_offer` (with steps), `create_offer`, `update_offer`, `delete_offer`, `add_interview_step`, `update_interview_step`, `reorder_interview_steps`, `delete_interview_step`. It's a client of the API (`src/api-client.ts`), never of the database. Registered for Claude Code in `.mcp.json` (`make mcp`); the cluster must be running.
- **stdio only.** Don't add a network transport (Streamable HTTP) before the API has authentication: it would let anyone who can reach it change and delete data.
- Built on the MCP TypeScript SDK **v2** (`@modelcontextprotocol/server`, `/server/stdio`; `@modelcontextprotocol/client` in tests), not the v1 `@modelcontextprotocol/sdk`. Tool schemas are `z.object(...)` (raw shapes are deprecated in v2); `InMemoryTransport` pairs must come from one package.
- A new API operation the user needs gets a tool in `src/server.ts`: a Zod input and output object in `src/schemas.ts` (limits with `satisfies` the shared limit types, statuses from the `Record`), a description written for the model, and annotations (`readOnlyHint` for reads, `destructiveHint` for deletions, `idempotentHint` for updates). Results go through `run()`, which returns structured content and turns API errors into readable tool errors.
- **Kept in step with the back by guards, not by hand-checking.** Data and business rules always come live from the API; the API's _shape_ is checked three ways, so a back change the tools don't follow fails `make check`:
  - compile time (`src/schemas.ts`, `…MatchesApi` types): output schemas must equal the shared response types, and tool inputs must have exactly the fields of the shared request types (`Type 'false' does not satisfy the constraint 'true'` points at the one that drifted);
  - runtime: `run(outputSchema, …)` parses every result, so only documented fields reach the model and a response the schemas no longer describe becomes a "may need an update" tool error;
  - `src/api-coverage.test.ts` reads `back/openapi.json`: every API operation must map to a tool or be excluded with a reason in `COVERAGE`, and each tool must accept every body field and query parameter its operation does.
    After an API change: `make openapi`, then update the MCP schemas and tools until `make check` passes.
- stdout carries the protocol: log to stderr only (`no-console` allows `console.error`).
- Node runs the sources directly: only erasable TypeScript (`erasableSyntaxOnly`, no enums or parameter properties) and relative imports ending in `.ts`.
- Tests (`src/*.test.ts`) connect a real MCP client to the server with `InMemoryTransport` and a fake `EmploiApi`.

## Browser tests (Playwright)

- `e2e/` tests user flows in Chromium against the deployed cluster, not a dev server: after changing the UI or the API, run `make images deploy` then `make test-browser`. They are not part of `make check` (which works without a cluster).
- The cluster database holds real data: use the `offers` fixture (`e2e/fixtures/offers.ts`). It gives unique titles (`uniqueTitle`), creates data through the API (`create`, `addStep`), registers offers created through the UI (`track(page.url())`), and deletes everything after each test (steps go with their offer). Assert only on data the test created; never assume an empty database or a fixed count.
- Prefer role and label locators (`getByRole`, `getByLabel`) and web-first assertions (`await expect(locator)…`); `eslint-plugin-playwright` enforces the rest. Locators use the French labels of the catalogue. Base URLs can be overridden with `E2E_BASE_URL` / `E2E_API_URL`.

## Code quality requirements

Best practices everywhere, checked by tools rather than by hand (ADR-0008). Work isn't done until `make check` passes.

- TypeScript strict mode plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Don't use `any`, `@ts-ignore` or non-null `!` to silence the compiler: fix the types.
- ESLint with typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` in every package (plus `eslint-config-next` in front), Prettier from the root config. Don't disable rules inline without a stated reason.
- If a check is missing for a package, add it rather than skipping it.
