// Offers API (adrs/0011-offer-data-model-and-api.md, adrs/0014-offer-company-optional.md,
// adrs/0020-offer-list-filters-sorting-and-pagination.md, adrs/0022-offer-status.md).

import type { PageQuery, SortOrder } from './pagination.js';

/**
 * Where the application for an offer stands, chosen by the user. Listed in
 * the order of a search (sorting by status follows it). Each side derives
 * its runtime list from a `Record<OfferStatus, …>`, so a new status breaks
 * the build until both handle it.
 */
export type OfferStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn';

/**
 * Fields the offer list can be sorted by. Each side derives its runtime list
 * from a `Record<OfferSortField, …>`, so a new field breaks the build until
 * both handle it.
 */
export type OfferSortField =
  'appliedAt' | 'createdAt' | 'title' | 'company' | 'status';

/** Query of `GET /offers`: filters, sort and page. */
export interface ListOffersQuery extends PageQuery {
  /** Contained in the title, company or location, ignoring case. */
  q?: string;
  /** Applied on or after this day, `YYYY-MM-DD`. */
  appliedFrom?: string;
  /** Applied on or before this day, `YYYY-MM-DD`. */
  appliedTo?: string;
  /** Only offers with one of these statuses; all when absent. */
  status?: OfferStatus[];
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
  status: OfferStatus;
  /** The offer's image, `null` when it has none (adrs/0031-offer-image.md). */
  image: OfferImage | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/**
 * Image formats an offer image may have, detected from its bytes. Each side
 * derives its runtime list from a `Record<OfferImageType, …>`.
 */
export type OfferImageType =
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/** What an offer says about its image; the bytes are at `GET /offers/:offerId/image`. */
export interface OfferImage {
  contentType: OfferImageType;
  /** Size in bytes. */
  byteSize: number;
  /** ISO 8601 timestamp: changes when the image is replaced. */
  updatedAt: string;
}

/** Largest image the API accepts, in bytes (10 MiB). */
export type OfferImageMaxBytes = 10_485_760;

/** Body of `POST /offers`. */
export interface CreateOfferRequest {
  title: string;
  company?: string | null;
  url?: string | null;
  location?: string | null;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  appliedAt?: string | null;
  /** Default `saved`. */
  status?: OfferStatus;
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
  status?: OfferStatus;
}

/** Maximum lengths enforced by the API. */
export interface OfferFieldLimits {
  title: 200;
  company: 200;
  url: 2048;
  location: 200;
  description: 20000;
}
