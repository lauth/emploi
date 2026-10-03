export type MoveDirection = 'up' | 'down';

export function isMoveDirection(value: unknown): value is MoveDirection {
  return value === 'up' || value === 'down';
}

/**
 * The ids in their new order after moving `id` one place up or down, or `null`
 * when it can't move (unknown id, already first or last).
 */
export function moveItem(
  ids: readonly string[],
  id: string,
  direction: MoveDirection,
): string[] | null {
  const from = ids.indexOf(id);
  const to = direction === 'up' ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) {
    return null;
  }
  const moved = [...ids];
  [moved[from], moved[to]] = [ids[to] ?? id, id];
  return moved;
}
