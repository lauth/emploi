// Languages of the interface (adrs/0016-internationalized-interface.md).

export const LOCALES = ['fr'] as const;

export type Locale = (typeof LOCALES)[number];

/** French only for now; no locale negotiation yet. */
export const DEFAULT_LOCALE: Locale = 'fr';
