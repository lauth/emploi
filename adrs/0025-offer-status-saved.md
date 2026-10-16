# 25. Offer status for offers not applied to yet

- Status: Accepted; default status superseded by ADR-0030
- Date: 2026-10-15
- Extends ADR-0022 (offer status)

## Context

The user also wants to record offers they spotted but haven't applied to yet, to keep track of them before applying. The statuses of ADR-0022 all describe an application that was sent.

## Decision

- A new status `saved` ("À postuler"), first in the order of a search: `saved`, `applied`, `interviewing`, `offered`, `accepted`, `rejected`, `ghosted`, `withdrawn`. Sorting by status puts these offers first in ascending order.
- The default status of a new offer stays `applied`: the form still opens on it, and the API and MCP default don't change.
- The migration is written by hand (`ALTER TYPE … ADD VALUE 'saved' BEFORE 'applied'`): Prisma would append the value, and the sort follows the enum's order.
- Such offers usually have no application date (`appliedAt`), which sorts them after the others in the default list order; the status filter ("À postuler") lists them.
- The front shows them with the `warning` badge tone (something to do); the MCP server tells the model to create offers the user only wants to keep as `saved`.

## Consequences

- "Offers" now covers offers not applied to yet; the domain description in CLAUDE.md is updated.
- Applying is a status change (`saved` → `applied`), plus the application date, made by the user.
