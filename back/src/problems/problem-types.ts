import type { ProblemType, ProblemTypeDescription } from '@emploi/shared';

// The kinds of problem the API answers with (adrs/0024-problem-details-errors.md).
// Written for API clients, AI agents included: each description says when the
// problem happens and how to fix the request.

/** A Record lists every kind: one added to the shared type breaks the build until described here. */
const PROBLEMS: Record<ProblemType, Omit<ProblemTypeDescription, 'type'>> = {
  'validation-error': {
    title: 'Invalid request',
    status: 400,
    description:
      'Some values of the body, query or path are invalid. `errors` lists each one: ' +
      'where it is (`in`: body, query or path), its `name` (a JSON Pointer into the ' +
      'body such as `/title`, or the parameter name), the rule broken (`code`) and, ' +
      'when they help, the accepted values (`allowed`) or the maximum length ' +
      '(`maxLength`). Fix every listed value and send the request again; unknown ' +
      'fields (`whitelistValidation`) must be removed.',
  },
  'malformed-request': {
    title: 'Malformed request',
    status: 400,
    description:
      'The request could not be read, e.g. its body is not valid JSON. Send a JSON ' +
      'body with `Content-Type: application/json`.',
  },
  'resource-not-found': {
    title: 'Resource not found',
    status: 404,
    description:
      'No offer or interview step has this id (`resource` says which). It may have ' +
      'been deleted. List offers with `GET /offers`, and the steps of an offer with ' +
      '`GET /offers/{offerId}/steps`, to get valid ids.',
  },
  'route-not-found': {
    title: 'No such endpoint',
    status: 404,
    description:
      'No endpoint matches this method and path. The endpoints are described by the ' +
      'OpenAPI document at `/docs-json`.',
  },
  'service-unavailable': {
    title: 'Service unavailable',
    status: 503,
    description:
      'The API cannot serve requests right now, e.g. the database is unreachable. ' +
      'Try again later.',
  },
  'internal-error': {
    title: 'Internal error',
    status: 500,
    description:
      'The API failed unexpectedly; the request may be valid. Try again later; the ' +
      'error is logged on the server.',
  },
};

export const PROBLEM_TYPES = Object.keys(PROBLEMS) as ProblemType[];

/** `type` URI of a kind of problem, relative to the API. */
export function problemTypeUri(type: ProblemType): string {
  return `/problems/${type}`;
}

export function describeProblemType(type: ProblemType): ProblemTypeDescription {
  return { type: problemTypeUri(type), ...PROBLEMS[type] };
}

export function isProblemType(value: string): value is ProblemType {
  return Object.hasOwn(PROBLEMS, value);
}
