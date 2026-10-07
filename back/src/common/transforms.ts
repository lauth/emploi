import { Transform } from 'class-transformer';

/** Trims string input. Other values are left for the validators to reject. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/**
 * A repeatable query parameter as an array: `?a=x` gives `'x'` and `?a=x&a=y`
 * gives `['x', 'y']`, both become arrays. Other values are left for the
 * validators to reject.
 */
export const ToArray = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? [value] : value,
  );

/** Trims string input and turns an empty string into `null` (optional fields). */
export const TrimToNull = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
