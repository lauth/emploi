import type { OfferSortField, SortOrder } from '@emploi/shared';

// Sorting of the offer list (adrs/0020-offer-list-filters-sorting-and-pagination.md).
// Records list every sort field and order, and only those: a value added to the
// shared types breaks the build until it is handled here.

/**
 * Default direction of each sort field: most recent dates first, text A to Z,
 * statuses in the order of a search (applied first, adrs/0022-offer-status.md).
 */
export const DEFAULT_ORDERS: Record<OfferSortField, SortOrder> = {
  appliedAt: 'desc',
  createdAt: 'desc',
  title: 'asc',
  company: 'asc',
  status: 'asc',
};

export const OFFER_SORT_FIELDS = Object.keys(
  DEFAULT_ORDERS,
) as OfferSortField[];

/** The list is sorted by application date unless asked otherwise. */
export const DEFAULT_SORT: OfferSortField = 'appliedAt';

const ORDERS: Record<SortOrder, true> = { asc: true, desc: true };

export const SORT_ORDERS = Object.keys(ORDERS) as SortOrder[];
