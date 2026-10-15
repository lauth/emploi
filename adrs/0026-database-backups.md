# 26. Database backups outside the cluster

- Status: Accepted
- Date: 2026-10-15

## Context

The database lives in the k3d cluster: PostgreSQL's volume is a directory of the k3d node container, inside Docker's data root (ADR-0005, ADR-0006). On 2026-10-15, after Docker's data root was moved, the `emploi` cluster and its node volume were gone and the user's offers were lost: there was no copy anywhere else. Anything that removes the cluster or the node container (`make down`, `k3d cluster delete`, Docker cleanups or moves) takes the data with it.

## Decision

- `make db-backup` runs `pg_dump --format=custom` in the `postgres-0` pod and writes `backups/emploi-<YYYYmmdd-HHMMSS>.dump` on the host, outside the cluster and Docker. It writes to a `.partial` file first and keeps it only if non-empty, so a failed backup never looks like a good one. `pg_dump` runs in the pod: its version always matches the server's, and the credentials stay in the pod's environment.
- `make db-restore FILE=<dump>` saves the current database first (`db-backup`), restores the dump with `pg_restore --clean --if-exists --single-transaction` (all or nothing), then applies pending migrations (`db-deploy`) so a backup from an older version gets the current schema.
- `make down` backs up before deleting the cluster, and stops if the backup fails (`make cluster-delete` deletes without one).
- `backups/` is git-ignored and docker-ignored: it holds personal data. Copying it somewhere safe (another disk, a personal backup) is up to the user.

## Consequences

- The data survives the loss of the cluster or of Docker's data root, as long as a backup was made after the last changes: backups are manual (or at `make down`), not scheduled.
- A dump is plain PostgreSQL: it can be restored outside this tooling (`pg_restore`).
- Restoring replaces the whole database, including `_prisma_migrations`; the backup taken first makes it reversible.
