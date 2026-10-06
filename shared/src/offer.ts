// Offers API (adrs/0011-offer-data-model-and-api.md, adrs/0014-offer-company-optional.md,
// adrs/0020-offer-list-filters-sorting-and-pagination.md).

import type { PageQuery, SortOrder } from './pagination.js';

/**
 * Fields the offer list can be sorted by. Each side derives its runtime list
 * from a `Record<OfferSortField, …>`, so a new field breaks the build until
 * both handle it.
 */
export type OfferSortField = 'appliedAt' | 'createdAt' | 'title' | 'company';

/** Query of `GET /offers`: filters, sort and page. */
export interface ListOffersQuery extends PageQuery {
  /** Contained in the title, company or location, ignoring case. */
  q?: string;
  /** Applied on or after this day, `YYYY-MM-DD`. */
  appliedFrom?: string;
  /** Applied on or before this day, `YYYY-MM-DD`. */
  appliedTo?: string;
  /** Default `appliedAt`. */
  sort?: OfferSortField;
  /** Default: `desc` for dates, `asc` for text. Missing values always come last. */
  order?: SortOrder;
}

/** A job offer the user responded to, as returned by the API. */
export interface Offer {
  id: string;
  title: string;
  /** `null` when the offer doesn't name the employer. */
  company: string | null;
  url: string | null;
  location: string | null;
  description: string | null;
  /** Day the user responded, `YYYY-MM-DD`. */
  appliedAt: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/** Body of `POST /offers`. */
export interface CreateOfferRequest {
  title: string;
  company?: string | null;
  url?: string | null;
  location?: string | null;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  appliedAt?: string | null;
}

/**
 * Body of `PATCH /offers/:id`. Absent fields are left unchanged; `null`
 * clears an optional field.
 */
export interface UpdateOfferRequest {
  title?: string;
  company?: string | null;
  url?: string | null;
  location?: string | null;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  appliedAt?: string | null;
}

/** Maximum lengths enforced by the API. */
export interface OfferFieldLimits {
  title: 200;
  company: 200;
  url: 2048;
  location: 200;
  description: 20000;
}
