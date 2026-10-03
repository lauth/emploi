# 15. Interview step data model and API

- Status: Accepted
- Date: 2026-10-04

## Context

ADR-0004 decided that the interview process of an offer is an ordered, open-ended list of steps, each with its own type, date, status and notes, and that steps need an explicit position. The user asked for steps with a title, a description, a date and a status.

## Decision

### Model

An `InterviewStep` (table `interview_steps`) belongs to one offer:

| Field         | Type                     | Required | Notes                                                                         |
| ------------- | ------------------------ | -------- | ----------------------------------------------------------------------------- |
| `id`          | UUID v7                  | yes      |                                                                               |
| `offerId`     | UUID                     | yes      | Foreign key to `offers`; deleting an offer deletes its steps.                 |
| `position`    | integer                  | yes      | Order within the offer (ADR-0004). Internal: not exposed by the API.          |
| `title`       | text, ≤ 200 chars        | yes      | What the step is, free text ("Phone screen with HR"): the "type" of ADR-0004. |
| `description` | text, ≤ 20 000 chars     | no       | Notes: who, what was asked, feedback. The "notes" of ADR-0004.                |
| `date`        | date (no time)           | no       | A step can exist before it is scheduled.                                      |
| `status`      | enum, default `planned`  | yes      | See below.                                                                    |
| `createdAt`   | timestamp with time zone | yes      |                                                                               |
| `updatedAt`   | timestamp with time zone | yes      |                                                                               |

Statuses describe where the step stands, not the whole process:

| Value       | Meaning                                   |
| ----------- | ----------------------------------------- |
| `planned`   | To come (scheduled or not yet).           |
| `pending`   | Done, waiting for the answer.             |
| `passed`    | Successful, the process goes on.          |
| `failed`    | Rejected at this step.                    |
| `cancelled` | Didn't take place (cancelled, withdrawn). |

The date is a day without a time, like `appliedAt` (ADR-0011); a time can go in the description until it's needed as a field.

### Order

- Steps are listed by `position`, then `createdAt`, then `id`. A new step goes last.
- Positions can have gaps (after a deletion); only their order matters, which is why they aren't exposed.
- Reordering replaces the whole order at once: the client sends every step id of the offer in the new order, and the API rewrites the positions in a transaction. A list that doesn't contain exactly the offer's steps is rejected.

### API

Nested resource `/offers/:offerId/steps` in the `InterviewStepsModule` of `back`:

- `GET /offers/:offerId/steps`: the steps in order (not paginated: a process has a handful of steps).
- `POST /offers/:offerId/steps`: create at the end, `201`.
- `GET`, `PATCH`, `DELETE /offers/:offerId/steps/:stepId` (`204` on delete). `PATCH` follows ADR-0011: absent means unchanged, `null` clears an optional field; `title` and `status` can't be `null`.
- `PUT /offers/:offerId/steps/order` with `{ "stepIds": [...] }`: reorder, returns the steps in their new order.
- An unknown offer, or a step that belongs to another offer, answers `404`; malformed ids answer `400`.
- Types live in `@emploi/shared`. The list of statuses is a union type there; each side defines its runtime list from a `Record<InterviewStepStatus, …>` so the compiler rejects a missing or extra status.

## Consequences

- The front shows the steps on the offer page and moves a step up or down by sending the new full order.
- An overall status of the offer (ADR-0011 left it to the interview process) can now be derived from its steps; it isn't implemented yet.
