import {
  registerDecorator,
  ValidateIf,
  type ValidationArguments,
} from 'class-validator';

/**
 * Validates the property only when present. Unlike `@IsOptional()`, `null` is
 * validated (and rejected by the other decorators): for fields that may be
 * omitted but never cleared.
 */
export const IfPresent = (): PropertyDecorator =>
  ValidateIf((_object: object, value: unknown) => value !== undefined);

/**
 * The `YYYY-MM-DD` date must not be before the one in `property`, when both
 * are set (e.g. the end of a period). `YYYY-MM-DD` strings compare like dates.
 */
export function IsNotBefore(property: string): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isNotBefore',
      target: object.constructor,
      propertyName: String(propertyName),
      constraints: [property],
      options: {
        message: `${String(propertyName)} must not be before ${property}`,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const other = (args.object as Record<string, unknown>)[property];
          return (
            typeof value !== 'string' ||
            typeof other !== 'string' ||
            value >= other
          );
        },
      },
    });
  };
}
