import { pageCount } from './pagination';

describe('pageCount', () => {
  it('is at least 1', () => {
    expect(pageCount(0, 20)).toBe(1);
  });

  it('rounds up', () => {
    expect(pageCount(41, 20)).toBe(3);
  });
});
