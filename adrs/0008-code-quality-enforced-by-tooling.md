# 8. Code quality enforced by tooling

- Status: Accepted; test runner superseded by ADR-0010
- Date: 2026-10-03

## Context

The project should follow best practices everywhere, and that should be checked by tools rather than by review alone.

## Decision

- **TypeScript strict mode** in both apps. No `any`, `@ts-ignore` or non-null `!` to silence the compiler.
- **ESLint** with type-aware rules (typescript-eslint `recommendedTypeChecked` or stricter) and **Prettier** in both apps. Rules are not disabled inline without a stated reason.
- **Input validation at the API boundary**: NestJS DTOs use `class-validator`/`class-transformer` with a global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`). The front validates user input as well.
- **Tests**: unit tests for services and domain logic, e2e tests for API endpoints (Jest and Supertest), tests for front components that contain logic.
- **NestJS structure**: one feature module per domain concept, thin controllers, logic in services, DTOs for input and output.
- Type-check, lint, format check and tests are Make targets and must pass before a change is considered done.

## Consequences

- Development is slightly slower, but errors are caught early.
- Missing checks are added, not skipped.
