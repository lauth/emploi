import type { InvalidParam, ProblemDetails, ProblemType } from '@emploi/shared';
import { HttpException } from '@nestjs/common';
import { describeProblemType } from './problem-types.js';

/** Members of a problem that depend on the occurrence (not `instance`, added by the filter). */
export type ProblemExtras = Pick<ProblemDetails, 'errors' | 'resource'>;

/**
 * An error answered as RFC 9457 Problem Details by `ProblemFilter`
 * (adrs/0024-problem-details-errors.md). Its status comes from the kind of
 * problem.
 */
export class ProblemException extends HttpException {
  constructor(
    readonly problemType: ProblemType,
    readonly detail: string,
    readonly extras: ProblemExtras = {},
  ) {
    super(detail, describeProblemType(problemType).status);
  }
}

/** 400 `validation-error` listing every invalid value. */
export function validationProblem(errors: InvalidParam[]): ProblemException {
  const count = errors.length;
  const detail =
    count === 1
      ? '1 value is invalid: see `errors`, fix it and send the request again.'
      : `${String(count)} values are invalid: see \`errors\`, fix them and send the request again.`;
  return new ProblemException('validation-error', detail, { errors });
}

/** 404 `resource-not-found` for an offer. */
export function offerNotFound(offerId: string): ProblemException {
  return new ProblemException(
    'resource-not-found',
    `No offer has the id ${offerId}. It may have been deleted; list offers (GET /offers) to get valid ids.`,
    { resource: 'offer' },
  );
}

/** 404 `resource-not-found` for a step, or a step of another offer. */
export function interviewStepNotFound(
  offerId: string,
  stepId: string,
): ProblemException {
  return new ProblemException(
    'resource-not-found',
    `Offer ${offerId} has no interview step with the id ${stepId}. List its steps (GET /offers/${offerId}/steps) to get valid ids.`,
    { resource: 'interview-step' },
  );
}
