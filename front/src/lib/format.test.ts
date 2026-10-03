import { testFormatter } from '@/test/intl';
import { formatCompanyAndLocation, formatDate, formatDateTime } from './format';

describe('formatDate', () => {
  it('formats in French and never shifts the day', () => {
    expect(formatDate(testFormatter, '2026-09-28')).toBe('28 sept. 2026');
    expect(formatDate(testFormatter, '2026-01-01')).toBe('1 janv. 2026');
  });
});

describe('formatDateTime', () => {
  it('formats in French, in the configured time zone', () => {
    expect(formatDateTime(testFormatter, '2026-10-03T20:15:00.000Z')).toBe(
      '3 oct. 2026, 22:15',
    );
  });
});

describe('formatCompanyAndLocation', () => {
  it.each([
    ['Acme', 'Lyon', 'Acme · Lyon'],
    ['Acme', null, 'Acme'],
    [null, 'Lyon', 'Lyon'],
    [null, null, null],
  ])('formats %j and %j as %j', (company, location, expected) => {
    expect(formatCompanyAndLocation({ company, location })).toBe(expected);
  });
});
