# 28. Cluster reachable from localhost only

- Status: Accepted
- Date: 2026-10-15
- Complements ADR-0006 (local domains) and ADR-0019 (MCP over stdio)

## Context

The API has no authentication: anyone who can send it a request can read, change and delete the offers. ADR-0019 keeps the MCP server on stdio for that reason, but the cluster itself was exposed. `k8s/k3d-cluster.yaml` published ports 80 and 443 with no host IP, so Docker bound them on every interface (this was meant to cover IPv6, since `*.localhost` resolves to `::1`). A security audit (OWASP Top 10, A01/A05/A07) found the API answering on the machine's LAN address and on its public IPv6 addresses, so from the local network and possibly from the Internet, depending on the router's IPv6 firewall. k3d also published the Kubernetes API on `0.0.0.0` (it requires client certificates, but has no reason to be reachable).

## Decision

- Every port of the k3d cluster is bound to the loopback addresses only: Traefik's 80 and 443 on both `127.0.0.1` and `[::1]` (one mapping each), the Kubernetes API on `127.0.0.1` (`kubeAPI.hostIP`). The PostgreSQL NodePort already was (`127.0.0.1:54320`).
- Rule: as long as the API has no authentication, nothing in the cluster is published on a non-loopback address. Reaching the app from another device first needs authentication, in its own ADR.

## Consequences

- Only processes on the machine reach the app, the API and the database. Other local users and processes still can: this is not access control.
- Port mappings of a k3d cluster can't be changed in place: an existing cluster is recreated (`make down`, `make up`); the database survives in the `emploi-data` volume (ADR-0027) and `make down` backs it up first (ADR-0026).
