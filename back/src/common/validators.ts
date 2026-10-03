import { ValidateIf } from 'class-validator';

/**
 * Validates the property only when present. Unlike `@IsOptional()`, `null` is
 * validated (and rejected by the other decorators): for fields that may be
 * omitted but never cleared.
 */
export const IfPresent = (): PropertyDecorator =>
  ValidateIf((_object: object, value: unknown) => value !== undefined);
