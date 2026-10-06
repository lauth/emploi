import {
  DEFAULT_OFFER_LIST_QUERY,
  hasFilters,
  OFFER_SORT_OPTIONS,
  offerListHref,
  parseOfferListQuery,
  toApiQuery,
} from './offer-list-query';

describe('parseOfferListQuery', () => {
  it('defaults to the most recent application first, page 1 of 20', () => {
    expect(parseOfferListQuery({})).toEqual({
      q: '',
      appliedFrom: '',
      appliedTo: '',
      sort: 'appliedAt-desc',
      page: 1,
      size: 20,
    });
  });

  it('reads every parameter', () => {
    expect(
      parseOfferListQuery({
        q: '  backend ',
        appliedFrom: '2026-09-01',
        appliedTo: '2026-09-30',
        sort: 'title-asc',
        page: '3',
        size: '50',
      }),
    ).toEqual({
      q: 'backend',
      appliedFrom: '2026-09-01',
      appliedTo: '2026-09-30',
      sort: 'title-asc',
      page: 3,
      size: 50,
    });
  });

  it.each([
    ['sort', 'salary-desc'],
    ['sort', 'title'],
    ['page', '0'],
    ['page', '-2'],
    ['page', '2.5'],
    ['page', 'abc'],
    ['size', '30'],
    ['appliedFrom', '2026-02-30'],
    ['appliedTo', '30/09/2026'],
    ['q', 'x'.repeat(201)],
  ])('falls back to the default for an invalid %s (%j)', (name, value) => {
    expect(parseOfferListQuery({ [name]: value })).toEqual(
      DEFAULT_OFFER_LIST_QUERY,
    );
  });

  it('takes the first of a repeated parameter', () => {
    expect(parseOfferListQuery({ page: ['2', '5'] }).page).toBe(2);
  });

  it('reads a period entered backwards the right way round', () => {
    expect(
      parseOfferListQuery({
        appliedFrom: '2026-09-30',
        appliedTo: '2026-09-01',
      }),
    ).toMatchObject({ appliedFrom: '2026-09-01', appliedTo: '2026-09-30' });
  });
});

describe('OFFER_SORT_OPTIONS', () => {
  it('offers every field in both directions, the default first', () => {
    expect(OFFER_SORT_OPTIONS).toEqual([
      'appliedAt-desc',
      'appliedAt-asc',
      'createdAt-desc',
      'createdAt-asc',
      'title-desc',
      'title-asc',
      'company-desc',
      'company-asc',
    ]);
  });
});

describe('hasFilters', () => {
  it('is false for sort and paging only', () => {
    expect(
      hasFilters({ ...DEFAULT_OFFER_LIST_QUERY, sort: 'title-asc', page: 3 }),
    ).toBe(false);
  });

  it.each(['q', 'appliedFrom', 'appliedTo'] as const)(
    'is true with %s',
    (key) => {
      expect(
        hasFilters({ ...DEFAULT_OFFER_LIST_QUERY, [key]: '2026-09-01' }),
      ).toBe(true);
    },
  );
});

describe('toApiQuery', () => {
  it('maps the page to limit and offset, and the sort option to sort and order', () => {
    expect(
      toApiQuery({
        ...DEFAULT_OFFER_LIST_QUERY,
        q: 'backend',
        appliedFrom: '2026-09-01',
        sort: 'company-asc',
        page: 3,
        size: 10,
      }),
    ).toEqual({
      limit: 10,
      offset: 20,
      sort: 'company',
      order: 'asc',
      q: 'backend',
      appliedFrom: '2026-09-01',
    });
  });

  it('leaves out empty filters', () => {
    expect(toApiQuery(DEFAULT_OFFER_LIST_QUERY)).toEqual({
      limit: 20,
      offset: 0,
      sort: 'appliedAt',
      order: 'desc',
    });
  });
});

describe('offerListHref', () => {
  it('is the bare list for the defaults', () => {
    expect(offerListHref(DEFAULT_OFFER_LIST_QUERY)).toBe('/offers');
  });

  it('keeps the filters when changing page, leaving defaults out', () => {
    const query = {
      ...DEFAULT_OFFER_LIST_QUERY,
      q: 'dév',
      sort: 'title-asc' as const,
      size: 50 as const,
    };

    expect(offerListHref(query, { page: 2 })).toBe(
      '/offers?q=d%C3%A9v&sort=title-asc&page=2&size=50',
    );
    expect(offerListHref({ ...query, page: 2 }, { page: 1 })).toBe(
      '/offers?q=d%C3%A9v&sort=title-asc&size=50',
    );
  });
});
