import type { Formats } from 'next-intl';

/** Named formats, used as `format.dateTime(date, 'dateOnly')`. */
export const formats = {
  dateTime: {
    /** A moment, in the configured time zone: "3 oct. 2026, 22:15". */
    dateTime: { dateStyle: 'medium', timeStyle: 'short' },
    /**
     * A day without a time (`YYYY-MM-DD` values, stored as UTC midnight):
     * formatted in UTC so the day never shifts. "28 sept. 2026".
     */
    dateOnly: { dateStyle: 'medium', timeZone: 'UTC' },
  },
} satisfies Formats;
