import type { createFormatter } from 'next-intl';

/** next-intl's formatter: `await getFormatter()` on the server, `useFormatter()` on the client. */
type Formatter = ReturnType<typeof createFormatter>;

/** ISO 8601 timestamp, in the configured time zone: "3 oct. 2026, 22:15". */
export function formatDateTime(format: Formatter, iso: string): string {
  return format.dateTime(new Date(iso), 'dateTime');
}

/** `YYYY-MM-DD`, without any day shift: "28 sept. 2026". */
export function formatDate(format: Formatter, dateOnly: string): string {
  return format.dateTime(new Date(`${dateOnly}T00:00:00.000Z`), 'dateOnly');
}

/** "Acme · Lyon", leaving out what's missing; `null` when both are. */
export function formatCompanyAndLocation(offer: {
  company: string | null;
  location: string | null;
}): string | null {
  const parts = [offer.company, offer.location].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(' · ') : null;
}
