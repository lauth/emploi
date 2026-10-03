import type { OfferFieldLimits } from '@emploi/shared';

/** `satisfies` makes the compiler reject any drift from the shared limits. */
export const OFFER_LIMITS = {
  title: 200,
  company: 200,
  url: 2048,
  location: 200,
  description: 20000,
} as const satisfies OfferFieldLimits;
