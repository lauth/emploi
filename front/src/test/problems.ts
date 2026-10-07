import type { InvalidParam, ProblemDetails, ProblemType } from '@emploi/shared';
import { ApiError } from '@/lib/api';

// API errors for tests, shaped like the API's Problem Details
// (adrs/0024-problem-details-errors.md).

const STATUSES: Record<ProblemType, number> = {
  'validation-error': 400,
  'malformed-request': 400,
  'resource-not-found': 404,
  'route-not-found': 404,
  'service-unavailable': 503,
  'internal-error': 500,
};

export function problem(
  type: ProblemType,
  extras: Partial<ProblemDetails> = {},
): ProblemDetails {
  return {
    type: `/problems/${type}`,
    title: type,
    status: STATUSES[type],
    detail: `Test ${type}`,
    instance: '/offers',
    ...extras,
  };
}

export function problemError(
  type: ProblemType,
  extras: Partial<ProblemDetails> = {},
): ApiError {
  return new ApiError(STATUSES[type], problem(type, extras));
}

/** A `validation-error` with these invalid values. */
export function validationError(...errors: InvalidParam[]): ApiError {
  return problemError('validation-error', { errors });
}
