# 14. The company of an offer is optional

- Status: Accepted
- Date: 2026-10-03
- Supersedes the "company is required" part of ADR-0011

## Context

ADR-0011 made `company` required on the grounds that an offer is meaningless without the employer. In practice many offers don't name the company: recruitment agencies, anonymous postings on job boards, recruiters reaching out on behalf of a client. Requiring it would force the user to invent a value.

## Decision

- `company` is optional, like `url` and `location`: nullable column, optional in `CreateOfferRequest`, nullable in `Offer`.
- On `PATCH`, `null` clears it, like the other optional fields. Blank input is stored as `null`.
- `title` stays the only required field.
- Where the company is shown next to the location ("Acme · Lyon"), missing parts are left out.

## Consequences

- The migration only drops the `NOT NULL` constraint; existing offers keep their company.
- When the company becomes known later (e.g. at the first interview), the user can add it by editing the offer.
