# 3. PostgreSQL with Prisma

- Status: Accepted
- Date: 2026-10-03

## Context

The data is relational: an application belongs to a company and has an ordered list of interview steps. The backend needs type-safe database access.

## Decision

- **PostgreSQL** is the database.
- **Prisma** is the ORM. `back/prisma/schema.prisma` is the single source of truth for the data model.
- Schema changes go through Prisma migrations (`prisma migrate dev`), which are committed and never edited once applied.
- The backend accesses the database only through an injectable `PrismaService`, used from services, never from controllers.
- The connection string comes from the `DATABASE_URL` environment variable.

## Consequences

- Database types are generated from the schema, so `prisma generate` must run after every schema change.
- Prisma models must not be returned directly from the API; responses go through DTOs.
