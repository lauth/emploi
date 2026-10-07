import type {
  ListOffersQuery,
  OfferSortField,
  OfferStatus,
  SortOrder,
} from '@emploi/shared';
import { z } from 'zod';
import { OFFER_STATUSES } from './offer-form';

// State of the offer list, kept in the URL (adrs/0020-offer-list-filters-sorting-and-pagination.md):
// /offers?q=…&appliedFrom=…&appliedTo=…&sort=title-asc&page=2&size=50
// Anything invalid in the URL falls back to its default instead of erroring.

/**
 * Natural direction of each sort field, used when a column header is clicked
 * for the first time: most recent dates first, text A to Z (as the API).
 * Records list every sort field and order: a new one breaks the build until handled.
 */
const FIELD_ORDERS: Record<OfferSortField, SortOrder> = {
  appliedAt: 'desc',
  createdAt: 'desc',
  title: 'asc',
  company: 'asc',
  status: 'asc',
};
const SORT_FIELDS = FIELD_ORDERS;
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
  /** Statuses kept, in the order of `OFFER_STATUSES`; empty keeps them all. */
  status: OfferStatus[];
  sort: OfferSortOption;
  page: number;
  size: PageSize;
}

export const DEFAULT_OFFER_LIST_QUERY: OfferListQuery = {
  q: '',
  appliedFrom: '',
  appliedTo: '',
  status: [],
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

/**
 * `?status=a&status=b`: the known statuses, each once, in the order of the
 * list; unknown values are dropped.
 */
const statuses = z.preprocess(
  (value: SearchParam) => {
    const given = new Set(value === undefined ? [] : [value].flat());
    return OFFER_STATUSES.filter((status) => given.has(status));
  },
  z.array(z.enum(OFFER_STATUSES)),
);

const schema = z.object({
  q: orDefault(z.string().trim().max(200), ''),
  appliedFrom: orDefault(dateOnly, ''),
  appliedTo: orDefault(dateOnly, ''),
  status: statuses,
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

/** True when the list is narrowed by a search, a period or statuses. */
export function hasFilters(query: OfferListQuery): boolean {
  return Boolean(
    query.q || query.appliedFrom || query.appliedTo || query.status.length,
  );
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
    ...(query.status.length ? { status: query.status } : {}),
  };
}

type OfferListKey = keyof OfferListQuery;

/**
 * The URL parameters of a list state, default values left out; a list
 * repeats its parameter (`status=a&status=b`).
 */
function nonDefaultEntries(query: OfferListQuery): [OfferListKey, string][] {
  return (Object.keys(DEFAULT_OFFER_LIST_QUERY) as OfferListKey[]).flatMap(
    (key): [OfferListKey, string][] => {
      const value = query[key];
      if (Array.isArray(value)) {
        return value.map((item) => [key, item]);
      }
      return value !== DEFAULT_OFFER_LIST_QUERY[key] && value !== ''
        ? [[key, String(value)]]
        : [];
    },
  );
}

/** URL of the list in a state; default values are left out to keep URLs short. */
export function offerListHref(
  query: OfferListQuery,
  changes: Partial<OfferListQuery> = {},
): string {
  const search = new URLSearchParams(
    nonDefaultEntries({ ...query, ...changes }),
  ).toString();
  return search ? `/offers?${search}` : '/offers';
}

/**
 * Hidden inputs a GET form needs to keep the rest of the list state: the form
 * sends only its own fields, so the others ride along as `[name, value]`
 * pairs. `fields` are the ones the form edits itself; the page always resets
 * to 1, since the results change.
 */
export function keptFields(
  query: OfferListQuery,
  fields: OfferListKey[],
): [OfferListKey, string][] {
  return nonDefaultEntries(query).filter(
    ([key]) => key !== 'page' && !fields.includes(key),
  );
}

/** `aria-sort` of a column: the direction when the list is sorted by it. */
export function sortState(
  query: OfferListQuery,
  field: OfferSortField,
): 'ascending' | 'descending' | 'none' {
  const [sort, order] = query.sort.split('-');
  if (sort !== field) {
    return 'none';
  }
  return order === 'asc' ? 'ascending' : 'descending';
}

/**
 * Sort after clicking a column header: the other direction when the list is
 * already sorted by it, its natural direction otherwise.
 */
export function nextSort(
  query: OfferListQuery,
  field: OfferSortField,
): OfferSortOption {
  const state = sortState(query, field);
  if (state === 'none') {
    return `${field}-${FIELD_ORDERS[field]}`;
  }
  return `${field}-${state === 'ascending' ? 'desc' : 'asc'}`;
}
