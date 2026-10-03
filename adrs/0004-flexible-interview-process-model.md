# 4. Flexible interview process model

- Status: Accepted
- Date: 2026-10-03

## Context

emploi stores job offers the user applied to (link, title, description, company) and the steps of each interview process. Every company runs its process differently: number, kind and order of steps vary (phone screen, technical test, take-home, onsite, offer…).

## Decision

- The interview process is an **ordered, open-ended list of steps** attached to an application, not a fixed pipeline.
- Each step has its own type, date, status and notes.
- No predefined set of stages is hardcoded in the database schema or the UI.

## Consequences

- Any company's process can be recorded as it happens, including unusual steps.
- Steps need an explicit position to preserve their order.
- Statistics across applications (e.g. "how far did I get") have to be computed from step data rather than from a single stage column.
