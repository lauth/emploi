# 1. Record architecture decisions

- Status: Accepted
- Date: 2026-10-03

## Context

Design choices for emploi (stack, data model, infrastructure, tooling) need to stay explainable later, both to the author and to AI coding assistants working in the repository.

## Decision

Record every significant design decision as an Architecture Decision Record (ADR) in `adrs/`, using this format (Context, Decision, Consequences).

- Files are named `NNNN-short-title.md` with a 4-digit sequential number.
- Status is one of `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-NNNN`.
- An accepted ADR is not rewritten. To change a decision, write a new ADR and mark the old one as superseded.

## Consequences

- The reasoning behind the architecture is in the repository, versioned with the code.
- Introducing a new technology or changing an existing decision requires an ADR first.
