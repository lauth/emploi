# 29. Security headers

- Status: Accepted
- Date: 2026-10-16

## Context

The OWASP Top 10 audit of 2026-10-15 (A05 Security Misconfiguration) found no security header on the front: no Content-Security-Policy, so an injected script would run and any site could frame the app (clickjacking on the delete buttons); no HSTS, no `nosniff`; and `X-Powered-By: Next.js`. The API only removed `X-Powered-By`.

## Decision

**Front.** A strict Content-Security-Policy based on a **nonce**, as Next's guide describes:

- `src/proxy.ts` generates a random nonce per request and sets the policy (`src/lib/security-headers.ts`) on the request, where Next reads it and adds the nonce to its scripts and styles, and on the response. Scripts: `'self' 'nonce-…' 'strict-dynamic'`, never `'unsafe-inline'`; `'unsafe-eval'` only for the dev server. Also `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Style attributes stay allowed (`style-src-attr 'unsafe-inline'`): the design system's `Popover` sets its CSS anchor through `style`. They can't run code.
- A nonce only reaches pages rendered per request: the root layout calls `connection()`, so every route is dynamic. Pages already were, except `/` (a redirect) and the 404 page.
- Zod is configured `jitless` (`src/lib/zod.ts`, the only module allowed to import `zod`, enforced by ESLint): otherwise it probes `new Function`, which the policy blocks, and the browser reports a violation.
- `next.config.ts` adds the headers that don't change per request on every path: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Cross-Origin-Opener-Policy: same-origin`, a `Permissions-Policy` denying camera, microphone, location, payment and USB; and `poweredByHeader: false`.

Rejected: a policy with `'unsafe-inline'` scripts (no nonce, pages could stay static), which wouldn't stop injected scripts; Next's experimental SRI (hashes); headers set by a Traefik middleware, which would apply to the cluster only and couldn't carry a nonce.

**API.** `helmet` with its defaults (`src/security/security-headers.ts`, applied in `main.ts`): HSTS, `nosniff`, `X-Frame-Options: SAMEORIGIN`, and a CSP under which Swagger UI works.

## Consequences

- An injected script or a framing page is blocked by the browser. A browser test (`e2e/tests/security-headers.spec.ts`) fails on any policy violation while using the app; a new feature the policy blocks shows up there.
- No page can be prerendered: every request renders on the server, which this app (one user, every page reads the API) already did.
- Anything that needs inline scripts, `eval` or another origin (a third-party script, fonts from a CDN) needs a change to the policy, with its reason.
- HSTS makes browsers refuse plain HTTP for these hosts for a year, which matches the HTTPS-only setup (ADR-0006).
