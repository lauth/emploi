# 20. Offer list: filters, sorting and pagination

- Status: Accepted
- Date: 2026-10-06
- Supersedes the order of `GET /offers` in ADR-0011 (newest `createdAt` first)

## Context

The user wants to filter and sort the list of offers, sorted by default by the most recent application date, and paginated, using default tools where possible. ADR-0011 listed offers by creation date, which is when the offer was recorded, not when the user applied. The API already paginates with `limit`/`offset`.

## Decision

### API: query parameters of `GET /offers`

| Parameter                  | Values                                       | Default     |
| -------------------------- | -------------------------------------------- | ----------- |
| `q`                        | text, ≤ 200 chars                            | none        |
| `appliedFrom`, `appliedTo` | `YYYY-MM-DD`, inclusive; `from` ≤ `to`       | none        |
| `sort`                     | `appliedAt`, `createdAt`, `title`, `company` | `appliedAt` |
| `order`                    | `asc`, `desc`                                | per field   |
| `limit`, `offset`          | unchanged (1–100, ≥ 0)                       | 20, 0       |

- `q` matches offers whose title, company or location contains it, ignoring case. Filters combine with AND.
- The default order of a field is descending for dates (most recent first) and ascending for text (A to Z), so `sort=title` alone reads naturally.
- Offers with no value for the sort field (no application date, no company) always come **last**, whatever the direction.
- Ties are broken by `createdAt` then `id`, descending, so pages are stable.
- Field names and sort fields are union types in `@emploi/shared`; each side derives its runtime lists from a `Record`, as for statuses.

### Default tools

- Filtering and sorting use **Prisma** queries (`contains` with `mode: 'insensitive'`, `orderBy` with `nulls: 'last'`); no search engine or extension.
- Text is sorted with the **ICU collation `und-x-icu`**, set on the `title` and `company` columns by migration: the database's default collation (libc on Alpine) puts capitals before lower case and accented letters after `z`. Prisma can't express a collation, so the migration is hand-edited; Prisma doesn't track column collations, so it doesn't see drift.
- An index on `(applied_at DESC, created_at DESC, id DESC)` serves the default order.
- The front keeps the list state **in the URL** (`?q=…&sort=…&page=…`) and filters with a **native HTML form** using `GET`: no client state library, it works without JavaScript, and a filtered list can be bookmarked or shared. Invalid parameters in the URL fall back to defaults instead of erroring.
- The front paginates by page number and page size (10, 20 or 50), mapped to `limit`/`offset`; links keep the filters.
- The MCP tool `list_offers` takes the same filters and sort (ADR-0019); its coverage test also checks query parameters.

## Consequences

- The default list shows offers by application date; offers recorded without one come after those that have one.
- Search is case-insensitive but not accent-insensitive ("developpeur" doesn't find "Développeur"); that would need the `unaccent` extension and raw SQL, and gets its own ADR if needed.
- Search uses `ILIKE '%…%'`, which can't use an index; fine for a personal history of hundreds or thousands of offers.
