import { formatCompanyAndLocation, formatDate } from './format';

describe('formatDate', () => {
  it('never shifts the day, whatever the time zone', () => {
    expect(formatDate('2026-09-28')).toBe('28 Sept 2026');
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026');
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
