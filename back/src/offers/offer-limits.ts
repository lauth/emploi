import type { OfferFieldLimits, OfferStatus } from '@emploi/shared';

/** `satisfies` makes the compiler reject any drift from the shared limits. */
export const OFFER_LIMITS = {
  title: 200,
  company: 200,
  url: 2048,
  location: 200,
  description: 20000,
} as const satisfies OfferFieldLimits;

// A Record must list every status, and only those: a status added to the
// shared type breaks the build until it is handled here (adrs/0022-offer-status.md).
const STATUSES: Record<OfferStatus, true> = {
  applied: true,
  interviewing: true,
  offered: true,
  accepted: true,
  rejected: true,
  ghosted: true,
  withdrawn: true,
};

export const OFFER_STATUSES = Object.keys(STATUSES) as OfferStatus[];

export const DEFAULT_OFFER_STATUS: OfferStatus = 'applied';
