// Timestamps use the server time zone (`TZ`, set in k8s/front.yaml): pages are
// rendered on the server.
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// Dates without a time are stored as UTC midnight: format them in UTC so the
// day never shifts.
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

/** ISO 8601 timestamp, e.g. "3 Oct 2026, 22:15". */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** `YYYY-MM-DD`, e.g. "28 Sept 2026". */
export function formatDate(dateOnly: string): string {
  return dateFormat.format(new Date(`${dateOnly}T00:00:00.000Z`));
}
