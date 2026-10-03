import { formatDate } from './format';

describe('formatDate', () => {
  it('never shifts the day, whatever the time zone', () => {
    expect(formatDate('2026-09-28')).toBe('28 Sept 2026');
    expect(formatDate('2026-01-01')).toBe('1 Jan 2026');
  });
});
