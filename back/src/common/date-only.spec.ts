import { DATE_ONLY_PATTERN, fromDateOnly, toDateOnly } from './date-only.js';

describe('date-only helpers', () => {
  it('round-trips a date', () => {
    expect(toDateOnly(fromDateOnly('2026-02-28'))).toBe('2026-02-28');
  });

  it('reads the date as UTC midnight', () => {
    expect(fromDateOnly('2026-10-03').toISOString()).toBe(
      '2026-10-03T00:00:00.000Z',
    );
  });

  it.each(['2026-10-03'])('accepts %s', (value) => {
    expect(DATE_ONLY_PATTERN.test(value)).toBe(true);
  });

  it.each(['2026-10-03T10:00:00Z', '03/10/2026', '2026-1-3', ''])(
    'rejects %j',
    (value) => {
      expect(DATE_ONLY_PATTERN.test(value)).toBe(false);
    },
  );
});
