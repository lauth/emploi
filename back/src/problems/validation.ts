import type { InvalidParam, InvalidParamLocation } from '@emploi/shared';
import {
  ParseUUIDPipe,
  ValidationPipe,
  type ArgumentMetadata,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { getMetadataStorage, type ValidationError } from 'class-validator';
import { validationProblem } from './problem.exception.js';

// Validation failures as `validation-error` problems
// (adrs/0024-problem-details-errors.md): one entry per invalid value and rule,
// with where it is and, when they help fix it, the accepted values or length.

/** Arguments of the rule `code` on a property, e.g. the values of `@IsIn`. */
function ruleArguments(
  target: object | undefined,
  property: string,
  code: string,
): unknown[] {
  if (target === undefined) {
    return [];
  }
  const rule = getMetadataStorage()
    .getTargetValidationMetadatas(target.constructor, '', true, false)
    .find(
      (metadata) =>
        metadata.propertyName === property && metadata.name === code,
    );
  return (rule?.constraints ?? []) as unknown[];
}

/** Help for fixing a value, from the rule's arguments. */
function hints(
  code: string,
  args: unknown[],
): Pick<InvalidParam, 'allowed' | 'maxLength'> {
  const [first] = args;
  if (code === 'isIn' && Array.isArray(first)) {
    return { allowed: first.map(String) };
  }
  if (code === 'maxLength' && typeof first === 'number') {
    return { maxLength: first };
  }
  return {};
}

/** JSON Pointer (RFC 6901) of a property path, e.g. `/stepIds/2`. */
function pointer(path: string[]): string {
  return path
    .map((part) => `/${part.replaceAll('~', '~0').replaceAll('/', '~1')}`)
    .join('');
}

/** class-validator errors (nested ones included) as invalid params. */
export function toInvalidParams(
  errors: ValidationError[],
  location: InvalidParamLocation,
  parentPath: string[] = [],
): InvalidParam[] {
  return errors.flatMap((error) => {
    const path = [...parentPath, error.property];
    const name = location === 'body' ? pointer(path) : path.join('.');
    const own = Object.entries(error.constraints ?? {}).map(
      ([code, detail]): InvalidParam => ({
        in: location,
        name,
        code,
        detail,
        ...hints(code, ruleArguments(error.target, error.property, code)),
      }),
    );
    return [...own, ...toInvalidParams(error.children ?? [], location, path)];
  });
}

/** Where Nest found an argument; custom decorators count as body. */
function locationOf(metadata: ArgumentMetadata): InvalidParamLocation {
  switch (metadata.type) {
    case 'query':
      return 'query';
    case 'param':
      return 'path';
    default:
      return 'body';
  }
}

/** Raised by the pipe's exception factory, before the location is known. */
class UnlocatedValidationErrors extends Error {
  constructor(readonly errors: ValidationError[]) {
    super('Validation failed');
  }
}

/**
 * The global ValidationPipe, answering `validation-error` problems that say
 * where each invalid value is (body, query or path).
 */
export class ProblemValidationPipe extends ValidationPipe {
  constructor(options: Omit<ValidationPipeOptions, 'exceptionFactory'>) {
    super({
      ...options,
      exceptionFactory: (errors) => new UnlocatedValidationErrors(errors),
    });
  }

  override async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    try {
      return (await super.transform(value, metadata)) as unknown;
    } catch (error) {
      if (error instanceof UnlocatedValidationErrors) {
        throw validationProblem(
          toInvalidParams(error.errors, locationOf(metadata)),
        );
      }
      throw error;
    }
  }
}

/** `ParseUUIDPipe` answering a `validation-error` that names the path parameter. */
export class ParseIdPipe extends ParseUUIDPipe {
  override async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<string> {
    const id = await super.transform(value, metadata).catch(() => null);
    if (typeof id === 'string') {
      return id;
    }
    const name = metadata.data ?? 'id';
    throw validationProblem([
      {
        in: 'path',
        name,
        code: 'isUuid',
        detail: `${name} must be a UUID, as returned by the API`,
      },
    ]);
  }
}
