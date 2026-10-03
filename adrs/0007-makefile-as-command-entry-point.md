# 7. Makefile as the command entry point

- Status: Accepted
- Date: 2026-10-03

## Context

Working on emploi involves pnpm, Prisma, Docker, k3d, kubectl and mkcert commands. Remembering each tool's syntax is error-prone.

## Decision

- A root **Makefile** is the single entry point for common tasks: install, dev, build, lint, format, typecheck, test, database migrations, certificates and the local cluster lifecycle.
- Every target has a `## description` comment, and `make help` lists them.
- A recurring workflow gets a Make target rather than being documented as a raw command.

## Consequences

- GNU Make is required.
- The Makefile must be kept in sync with the tooling it wraps.
