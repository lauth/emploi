import { Transform } from 'class-transformer';

/** Trims string input. Other values are left for the validators to reject. */
export const Trim = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
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
