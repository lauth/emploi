# 22. Offer status, chosen by the user

- Status: Accepted
- Date: 2026-10-07

## Context

The offer table (ADR-0021) has no status, and the user needs to see at a glance where each application stands. Offers had none: only interview steps have a status (ADR-0015). Two options:

- **derive** the status from the steps (no step → applied, otherwise the status of the last step);
- **store** a status on the offer, chosen by the user.

Deriving needs no input, but it can't express outcomes that have no step (no answer at all, a refusal before any interview, an offer accepted, an application withdrawn), and sorting or filtering by a computed value is awkward in SQL. The user chose a stored status.

## Decision

- `offers.status`, a PostgreSQL enum `offer_status`, `NOT NULL DEFAULT 'applied'`. Values, in the order of a search: `applied` (sent, no answer yet), `interviewing`, `offered`, `accepted`, `rejected`, `ghosted` (no answer after a long time), `withdrawn` (the user withdrew). Existing offers became `applied`.
- The status is set by the user only; it is **not** derived from or updated by the interview steps.
- API: `status` on the offer response; optional on `POST /offers` (default `applied`) and `PATCH /offers/:id` (can be changed, not cleared). `GET /offers` takes `status` as a repeated query parameter (`?status=applied&status=interviewing`) to keep some statuses, and `sort=status` sorts in the enum's declaration order (ascending by default), which PostgreSQL uses for enums.
- `OfferStatus` is a union type in `@emploi/shared`; each package builds its runtime list from a `Record<OfferStatus, …>` (back, front, MCP), so a new status breaks the build until handled. A new value goes at its place in the search order (`ALTER TYPE … ADD VALUE … BEFORE/AFTER`).
- Front: a select in the offer form, a coloured badge on the offer page and in a sortable "Statut" column of the table. Its header opens a filter with one checkbox per status (new design system `CheckboxGroup`), in a `Popover` like the period filter; the active filter shows above the table as a removable chip.
- MCP: `create_offer`/`update_offer` accept `status`, `list_offers` filters and sorts by it, and the server instructions tell the model to update the status when the user reports news.

## Consequences

- The user keeps the status up to date by hand: adding a "rejected" step doesn't change the offer's status. If that becomes tedious, a suggestion from the steps can be added later without changing the model.
- Statuses can be filtered and sorted in the database with an index-friendly enum column.
- Removing or renaming a status needs a migration of the existing rows.
