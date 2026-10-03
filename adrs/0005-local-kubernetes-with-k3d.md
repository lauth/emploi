# 5. Local Kubernetes with k3d

- Status: Accepted
- Date: 2026-10-03

## Context

Local development should run the whole system (database, API, front) the same way each time, in an environment close to a real deployment.

## Decision

- Local development runs on a small **k3d** cluster (k3s inside Docker).
- The cluster runs PostgreSQL, `back` and `front`. Kubernetes manifests live in `k8s/` at the repository root.
- `back` and `front` each have a `Dockerfile`. Images are built locally and loaded into the cluster (`k3d image import` or the k3d registry), so no remote registry is needed.
- Secrets such as `DATABASE_URL` are Kubernetes Secrets created from local, uncommitted values.

## Consequences

- Docker, k3d and kubectl are required on the dev machine.
- The manifests are a starting point for a future real deployment.
- Code changes require rebuilding and reloading images unless a faster dev loop is added later (its own ADR).
