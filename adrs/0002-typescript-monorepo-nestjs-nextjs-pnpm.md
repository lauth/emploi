# 2. TypeScript monorepo with NestJS, Next.js and pnpm

- Status: Accepted
- Date: 2026-10-03

## Context

emploi needs an API and a web interface. Using one language on both sides lets them share types and tooling.

## Decision

- One repository, `emploi`, organised as a **pnpm workspace** with two apps:
  - `back/`: **NestJS** API
  - `front/`: **Next.js** app
- **TypeScript** everywhere.
- **pnpm** is the only package manager; `pnpm-lock.yaml` is committed.
- Request/response types used by both apps have a single source of truth, never duplicated by hand. The exact mechanism (shared workspace package or generated types) will be chosen in its own ADR.

## Consequences

- One install and one lockfile for the whole project; both apps can depend on shared workspace packages.
- npm and yarn must not be used, since they would create a conflicting lockfile.
