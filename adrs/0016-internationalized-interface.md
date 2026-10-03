# 16. Internationalized interface, French only for now

- Status: Accepted
- Date: 2026-10-04

## Context

The interface must be translatable into several languages, and is only in French for now. Until now all text was hardcoded in English in the components, form validation and server actions, and dates were formatted in `en-GB`.

The Next.js guide shows hand-written dictionaries loaded in server components. emploi's forms are client components, so their text and validation messages need translations on the client too.

## Decision

- **next-intl** handles translations and formatting in server components, client components, server actions and metadata.
- **No locale in the URL** for now ("without i18n routing" setup): the locale is resolved in `front/src/i18n/request.ts`, and is always `fr`. Adding a language later means adding a catalogue and choosing how to pick the locale (URL prefix, cookie or `Accept-Language`); that choice gets its own ADR.
- **Catalogues** live in `front/messages/<locale>.json`; `fr.json` is the reference. Message keys are typed from it, so a missing or misspelled key fails the type check.
- **No hardcoded text in the UI**: every user-facing string comes from the catalogue. ESLint's `react/jsx-no-literals` enforces it in components; strings in props, metadata and server actions are covered by review and the browser tests.
- **Validation messages** are keys (`required`, `tooLong`…) produced by the Zod schemas and translated when the form errors are built, in the user's locale.
- **API validation messages are not shown** to the user: they're in English and meant for developers. The front validates the same rules first; if the API still rejects the data, the user gets a translated generic message and the details are logged.
- **Dates** use named formats (`front/src/i18n/formats.ts`) through next-intl's formatter, in the configured locale and time zone (`TZ`).
- Code, comments, ADRs and API messages stay in English.

## Consequences

- The UI language can be switched by adding a catalogue and a locale, without touching components.
- Tests render components with the French catalogue; browser tests use the French labels.
- One more dependency in the front.
