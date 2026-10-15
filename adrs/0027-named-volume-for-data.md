# 27. Database in a named Docker volume

- Status: Accepted
- Date: 2026-10-15
- Complements ADR-0026 (backups)

## Context

PostgreSQL's data was provisioned by k3s's local-path provisioner under `/var/lib/rancher/k3s/storage` in the k3d node container, which is one of the node's anonymous Docker volumes. `k3d cluster delete` removes those volumes (checked on a throwaway cluster): deleting or losing the cluster lost the database. A recreated cluster also got a new, empty volume with a new path (`pvc-<uid>_…`).

## Decision

- `k8s/k3d-cluster.yaml` mounts a **named** Docker volume, `emploi-data`, at `/var/lib/emploi` in the server node. `k3d cluster delete` keeps named volumes (checked: a file written in it was still there after deletion).
- PostgreSQL's storage is a **static** PersistentVolume `emploi-postgres` (`hostPath` `/var/lib/emploi/postgres`, `persistentVolumeReclaimPolicy: Retain`), pre-bound with `claimRef` to the StatefulSet's claim `data-postgres-0`, which asks for it by `volumeName` with no storage class. A recreated cluster binds the same path and finds the same database.
- Backups (ADR-0026) stay necessary: the volume still lives in Docker's data root, which can be moved or cleaned.

## Consequences

- `make down` / `k3d cluster delete` no longer lose the data; deleting it takes an explicit `docker volume rm emploi-data`.
- The volume is visible and recognisable: `docker volume ls`, `docker volume inspect emploi-data`.
- Changing a StatefulSet's `volumeClaimTemplates` isn't allowed in place: moving an existing cluster to this layout means recreating it (backup, `make down`, `make up`, restore).
- One node only: a `hostPath` volume is tied to the server node, which is what this single-node local cluster has.
