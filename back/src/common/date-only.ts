/** `YYYY-MM-DD`, the API format of dates without a time part. */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** PostgreSQL `date` columns come back from Prisma as UTC midnight. */
export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
