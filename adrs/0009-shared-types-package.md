# 9. Shared types package

- Status: Accepted
- Date: 2026-10-03

## Context

ADR-0002 requires a single source of truth for the request and response shapes used by both `back` and `front`, and leaves the mechanism to its own ADR. The options were a shared workspace package or types generated from the API (e.g. from an OpenAPI document).

## Decision

- A workspace package, `@emploi/shared` in `shared/`, holds the API request and response types.
- It contains **types only, no runtime code**. Consumers import it with `import type`, so nothing from it exists at runtime and it needs no build step: its `exports` point straight at the TypeScript sources.
- Both apps depend on it with `workspace:*` as a dev dependency.
- `back` DTO classes (validated with class-validator) implement these types, so the compiler flags any drift between validation and the shared contract.

## Consequences

- No code generation and no build step; changes are visible immediately in both apps.
- A value import (`import { … }` instead of `import type { … }`) from `@emploi/shared` would fail at runtime. The back e2e tests and the front build catch it.
- If runtime code ever needs sharing (e.g. validation schemas), this ADR must be superseded, since the package would then need a build step.
