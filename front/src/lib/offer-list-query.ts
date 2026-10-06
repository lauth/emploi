import type {
  ListOffersQuery,
  OfferSortField,
  SortOrder,
} from '@emploi/shared';
import { z } from 'zod';

// State of the offer list, kept in the URL (adrs/0020-offer-list-filters-sorting-and-pagination.md):
// /offers?q=…&appliedFrom=…&appliedTo=…&sort=title-asc&page=2&size=50
// Anything invalid in the URL falls back to its default instead of erroring.

/** Records list every sort field and order: a new one breaks the build until handled. */
const SORT_FIELDS: Record<OfferSortField, true> = {
  appliedAt: true,
  createdAt: true,
  title: true,
  company: true,
};
const ORDERS: Record<SortOrder, true> = { desc: true, asc: true };

/** A sort choice of the list, e.g. `appliedAt-desc`. */
export type OfferSortOption = `${OfferSortField}-${SortOrder}`;

/** Every sort choice, in the order of the select: each field, then each direction. */
export const OFFER_SORT_OPTIONS = (
  Object.keys(SORT_FIELDS) as OfferSortField[]
).flatMap((field) =>
  (Object.keys(ORDERS) as SortOrder[]).map(
    (order): OfferSortOption => `${field}-${order}`,
  ),
);

/** Most recent application first. */
export const DEFAULT_SORT_OPTION: OfferSortOption = 'appliedAt-desc';

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 20;

export interface OfferListQuery {
  q: string;
  appliedFrom: string;
  appliedTo: string;
  sort: OfferSortOption;
  page: number;
  size: PageSize;
}

export const DEFAULT_OFFER_LIST_QUERY: OfferListQuery = {
  q: '',
  appliedFrom: '',
  appliedTo: '',
  sort: DEFAULT_SORT_OPTION,
  page: 1,
  size: DEFAULT_PAGE_SIZE,
};

/** A value of `searchParams`: the first one if repeated. */
type SearchParam = string | string[] | undefined;

const first = (value: SearchParam) => (Array.isArray(value) ? value[0] : value);

/** A schema whose failures fall back to `fallback`. */
const orDefault = <T>(schema: z.ZodType<T>, fallback: T) =>
  z.preprocess(first, schema).catch(fallback);

const dateOnly = z.iso.date();

const schema = z.object({
  q: orDefault(z.string().trim().max(200), ''),
  appliedFrom: orDefault(dateOnly, ''),
  appliedTo: orDefault(dateOnly, ''),
  sort: orDefault(z.enum(OFFER_SORT_OPTIONS), DEFAULT_SORT_OPTION),
  page: orDefault(z.coerce.number().int().min(1).max(100000), 1),
  size: orDefault(
    z.coerce
      .number()
      .refine((value): value is PageSize =>
        (PAGE_SIZES as readonly number[]).includes(value),
      ),
    DEFAULT_PAGE_SIZE,
  ),
});

/** Reads the list state from the page's `searchParams`. */
export function parseOfferListQuery(
  searchParams: Record<string, SearchParam>,
): OfferListQuery {
  const query: OfferListQuery = schema.parse(searchParams);
  // A period entered backwards is read the right way round.
  if (
    query.appliedFrom &&
    query.appliedTo &&
    query.appliedFrom > query.appliedTo
  ) {
    return {
      ...query,
      appliedFrom: query.appliedTo,
      appliedTo: query.appliedFrom,
    };
  }
  return query;
}

/** True when the list is narrowed by a search or a period. */
export function hasFilters(query: OfferListQuery): boolean {
  return Boolean(query.q || query.appliedFrom || query.appliedTo);
}

/** The API query of a list state. */
export function toApiQuery(query: OfferListQuery): ListOffersQuery {
  const [sort, order] = query.sort.split('-') as [OfferSortField, SortOrder];
  return {
    limit: query.size,
    offset: (query.page - 1) * query.size,
    sort,
    order,
    ...(query.q ? { q: query.q } : {}),
    ...(query.appliedFrom ? { appliedFrom: query.appliedFrom } : {}),
    ...(query.appliedTo ? { appliedTo: query.appliedTo } : {}),
  };
}

/** URL of the list in a state; default values are left out to keep URLs short. */
export function offerListHref(
  query: OfferListQuery,
  changes: Partial<OfferListQuery> = {},
): string {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  for (const key of Object.keys(
    DEFAULT_OFFER_LIST_QUERY,
  ) as (keyof OfferListQuery)[]) {
    const value = next[key];
    if (value !== DEFAULT_OFFER_LIST_QUERY[key] && value !== '') {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `/offers?${search}` : '/offers';
}
