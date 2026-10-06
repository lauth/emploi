/** Number of pages of a list, at least 1 (an empty list still has its first page). */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
