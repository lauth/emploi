import {
  DEFAULT_OFFER_LIST_QUERY,
  hasFilters,
  keptFields,
  nextSort,
  OFFER_SORT_OPTIONS,
  offerListHref,
  parseOfferListQuery,
  sortState,
  toApiQuery,
} from './offer-list-query';

describe('sortState', () => {
  it('gives the aria-sort of each column', () => {
    const query = { ...DEFAULT_OFFER_LIST_QUERY, sort: 'title-asc' as const };

    expect(sortState(query, 'title')).toBe('ascending');
    expect(sortState(query, 'appliedAt')).toBe('none');
    expect(sortState(DEFAULT_OFFER_LIST_QUERY, 'appliedAt')).toBe('descending');
  });
});

describe('nextSort', () => {
  it.each([
    ['title', 'title-asc'],
    ['company', 'company-asc'],
    ['createdAt', 'createdAt-desc'],
  ] as const)(
    'sorts by %s in its natural direction on the first click',
    (field, expected) => {
      expect(nextSort(DEFAULT_OFFER_LIST_QUERY, field)).toBe(expected);
    },
  );

  it('reverses the column the list is sorted by', () => {
    expect(nextSort(DEFAULT_OFFER_LIST_QUERY, 'appliedAt')).toBe(
      'appliedAt-asc',
    );
    expect(
      nextSort({ ...DEFAULT_OFFER_LIST_QUERY, sort: 'title-asc' }, 'title'),
    ).toBe('title-desc');
  });
});

describe('keptFields', () => {
  it('keeps the other settings but not the page', () => {
    const query = {
      ...DEFAULT_OFFER_LIST_QUERY,
      q: 'backend',
      appliedFrom: '2026-09-01',
      sort: 'title-asc' as const,
      page: 3,
      size: 50 as const,
    };

    expect(keptFields(query, ['q'])).toEqual([
      ['appliedFrom', '2026-09-01'],
      ['sort', 'title-asc'],
      ['size', '50'],
    ]);
    expect(
      keptFields({ ...query, status: ['applied', 'offered'] }, ['status']),
    ).not.toContainEqual(['status', 'applied']);
    expect(
      keptFields({ ...query, status: ['applied', 'offered'] }, ['q']),
    ).toEqual([
      ['appliedFrom', '2026-09-01'],
      ['status', 'applied'],
      ['status', 'offered'],
      ['sort', 'title-asc'],
      ['size', '50'],
    ]);
    expect(keptFields(query, ['appliedFrom', 'appliedTo'])).toEqual([
      ['q', 'backend'],
      ['sort', 'title-asc'],
      ['size', '50'],
    ]);
  });

  it('is empty for the defaults', () => {
    expect(keptFields(DEFAULT_OFFER_LIST_QUERY, ['q'])).toEqual([]);
  });
});

describe('parseOfferListQuery', () => {
  it('defaults to the most recent application first, page 1 of 20', () => {
    expect(parseOfferListQuery({})).toEqual({
      q: '',
      appliedFrom: '',
      appliedTo: '',
      status: [],
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
        status: 'offered',
        sort: 'title-asc',
        page: '3',
        size: '50',
      }),
    ).toEqual({
      q: 'backend',
      appliedFrom: '2026-09-01',
      appliedTo: '2026-09-30',
      status: ['offered'],
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

  it('reads repeated statuses in list order, once each, dropping unknown ones', () => {
    expect(
      parseOfferListQuery({
        status: ['rejected', 'hired', 'applied', 'rejected'],
      }).status,
    ).toEqual(['applied', 'rejected']);
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
      'status-desc',
      'status-asc',
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

  it('is true with statuses', () => {
    expect(
      hasFilters({ ...DEFAULT_OFFER_LIST_QUERY, status: ['applied'] }),
    ).toBe(true);
  });
});

describe('toApiQuery', () => {
  it('maps the page to limit and offset, and the sort option to sort and order', () => {
    expect(
      toApiQuery({
        ...DEFAULT_OFFER_LIST_QUERY,
        q: 'backend',
        appliedFrom: '2026-09-01',
        status: ['applied', 'interviewing'],
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
      status: ['applied', 'interviewing'],
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

  it('repeats the status parameter', () => {
    expect(
      offerListHref(DEFAULT_OFFER_LIST_QUERY, {
        status: ['applied', 'interviewing'],
      }),
    ).toBe('/offers?status=applied&status=interviewing');
  });
});
