# 30. New offers are "À postuler" by default

- Status: Accepted
- Date: 2026-10-16
- Supersedes the default status of ADR-0025

## Context

ADR-0025 added the status `saved` ("À postuler") but kept `applied` as the default everywhere: in the form, the API and the MCP tools. In practice the user records offers as they spot them, before applying, and had to change the status every time. A default that differs between the form and the API would be confusing.

## Decision

- `saved` is the default status of a new offer everywhere:
  - the database column default (migration `offer_status_default_saved`) and the API (`DEFAULT_OFFER_STATUS`, documented in the OpenAPI document);
  - the new offer form, which opens on "À postuler" (`EMPTY_OFFER_FORM`);
  - the MCP tools: `create_offer` without a status records a saved offer; the instructions tell the model to pass `applied` when the user says they applied.
- Existing offers keep their status.

## Consequences

- Recording an offer already applied to takes one more choice (the form's select, `status: applied` through the API or MCP).
- Applying stays a status change (`saved` → `applied`) plus the application date.
