import { isMoveDirection, moveItem } from './move-item';

describe('moveItem', () => {
  const ids = ['a', 'b', 'c'];

  it('moves an item up', () => {
    expect(moveItem(ids, 'b', 'up')).toEqual(['b', 'a', 'c']);
  });

  it('moves an item down', () => {
    expect(moveItem(ids, 'b', 'down')).toEqual(['a', 'c', 'b']);
  });

  it('does not change the input', () => {
    moveItem(ids, 'b', 'up');
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it.each<[string, 'up' | 'down']>([
    ['a', 'up'],
    ['c', 'down'],
    ['unknown', 'up'],
  ])('returns null when %s cannot move %s', (id, direction) => {
    expect(moveItem(ids, id, direction)).toBeNull();
  });
});

describe('isMoveDirection', () => {
  it.each([
    ['up', true],
    ['down', true],
    ['left', false],
    [undefined, false],
  ])('%j → %j', (value, expected) => {
    expect(isMoveDirection(value)).toBe(expected);
  });
});
