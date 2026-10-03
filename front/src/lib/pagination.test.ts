import { pageCount, parsePageParam } from './pagination';

describe('parsePageParam', () => {
  it.each<[string | string[] | undefined, number]>([
    [undefined, 1],
    ['1', 1],
    ['3', 3],
    [['2', '5'], 2],
    ['0', 1],
    ['-2', 1],
    ['2.5', 1],
    ['abc', 1],
    ['99999999999999999999', 1],
  ])('reads %j as page %i', (value, page) => {
    expect(parsePageParam(value)).toBe(page);
  });
});

describe('pageCount', () => {
  it('is at least 1', () => {
    expect(pageCount(0, 20)).toBe(1);
  });

  it('rounds up', () => {
    expect(pageCount(41, 20)).toBe(3);
  });
});
