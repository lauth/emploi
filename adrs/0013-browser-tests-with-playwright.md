# 13. Browser end-to-end tests with Playwright

- Status: Accepted
- Date: 2026-10-03

## Context

Unit and API tests (ADR-0010) don't cover what only a real browser and the deployed stack show: server actions submitted from forms, redirects, confirmation dialogs, routing through Traefik over HTTPS, and the front calling the API inside the cluster (ADR-0012).

## Decision

- **Playwright** (`@playwright/test`) runs browser tests from a dedicated workspace package, `e2e/`. It tests the system as deployed, so it belongs to neither app.
- Tests run against the local k3d cluster: `https://emploi.localhost`, with the API at `https://api.emploi.localhost` for test data. Both URLs can be overridden with `E2E_BASE_URL` and `E2E_API_URL`.
- Chromium only for now; more browsers can be added as Playwright projects.
- The cluster database holds the user's real data, so tests never assume an empty database: each test creates uniquely named offers (through the API or the UI), asserts only on those, and deletes them afterwards through a fixture.
- HTTPS errors are ignored by the browser, because Playwright's Chromium profile doesn't trust the mkcert CA. Certificate trust is part of the cluster setup (ADR-0006), not of these tests.
- The tests are run by `make test-browser`, which needs a running cluster. They are **not** part of `make check`, which must keep working without one. Run them after `make images deploy` for any change that affects the UI or the API.
- The `e2e` package is linted (with `eslint-plugin-playwright`) and type-checked like every other package (ADR-0008).

## Consequences

- Real user flows are verified end to end before a change is considered done.
- Browser binaries are downloaded once per machine with `make browser-install` (into `~/.cache/ms-playwright`).
- If a test fails half-way, the fixture still deletes the offers it created; offers created through the UI are tracked by their URL so they are cleaned up too.
- Running the tests against the development database could conflict with manual use at the same moment; a dedicated test namespace can be introduced later if this becomes a problem.
