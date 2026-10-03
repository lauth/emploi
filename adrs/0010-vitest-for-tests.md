# 10. Vitest for tests in both apps

- Status: Accepted
- Date: 2026-10-03
- Supersedes the test runner part of ADR-0008 (Jest)

## Context

ADR-0008 named Jest and Supertest for the API tests. When the project was scaffolded, the NestJS 12 CLI generated a Vitest setup instead of Jest, and the back is an ES module project, which Vitest supports natively. Next.js works with either runner.

## Decision

- **Vitest** is the test runner for `back` and `front`.
- `back`: unit tests next to the code (`src/**/*.spec.ts`), e2e tests in `test/**/*.e2e-spec.ts` with **Supertest**, each with its own config (`vitest.config.ts`, `vitest.config.e2e.ts`).
- `front`: tests next to the code (`src/**/*.test.tsx`) with **Testing Library** and jsdom (`vitest.config.mts`).
- Everything else in ADR-0008 still applies.

## Consequences

- One test runner, one API (`describe`/`it`/`vi`) across the project.
- Vitest transforms code without full TypeScript decorator metadata for properties declared without a type annotation; class-transformer conversions must use explicit `@Type(() => …)` decorators rather than relying on implicit conversion.
