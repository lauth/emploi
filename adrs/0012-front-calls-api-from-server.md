# 12. The front calls the API from the server

- Status: Accepted
- Date: 2026-10-03
- Supersedes the part of ADR-0006 about the front calling the API at its public URL

## Context

ADR-0006 assumed the browser would call `https://api.emploi.localhost`, with the URL inlined into the bundle at build time (`NEXT_PUBLIC_API_URL`). Implementing the offers feature showed two problems:

- Inside the cluster, `*.localhost` resolves to the pod itself, so server-side code cannot use the public API URL.
- A build-time URL ties a Docker image to one environment.

Next.js server components and server actions can do all API calls on the server.

## Decision

- The front reads data in **server components** and mutates it with **server actions**. The browser never calls the API directly.
- All API calls go through one server-only client (`front/src/lib/api.ts`, guarded by the `server-only` package). It calls `connection()` before each request, so pages render at request time and are never prerendered with API data during `next build`, and it never caches responses.
- The API base URL is the **runtime** variable `API_URL`, validated at first use: `http://back` in the cluster, `https://api.emploi.localhost` when running the front on the host (with `NODE_EXTRA_CA_CERTS` pointing at the mkcert root CA).
- Form input is validated in the server action with **Zod** before calling the API, so the user gets per-field errors. The API remains the authority on validation; its `400` messages are shown too.
- `NEXT_PUBLIC_API_URL` and the corresponding Docker build argument are removed.

## Consequences

- One front image works in any environment.
- The API needs no CORS for the front. `CORS_ORIGINS` stays configured for direct browser access, but the front doesn't rely on it.
- Form validation rules are written twice (class-validator in `back`, Zod in `front`). Field length limits are declared once as a literal type in `@emploi/shared` (e.g. `OfferFieldLimits`), and each side defines its constants with `satisfies`, so the compiler rejects any drift. Other rules (required fields, URL and date formats) are kept in sync by hand and covered by tests on both sides.
