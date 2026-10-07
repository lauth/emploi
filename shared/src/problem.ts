// Error responses of the API: RFC 9457 Problem Details, `application/problem+json`
// (adrs/0024-problem-details-errors.md).

/**
 * Kinds of problem. The `type` of a response is `/problems/<ProblemType>`, a
 * URI relative to the API that `GET` documents, or `about:blank` for a plain
 * HTTP error. Each side derives its runtime list from a
 * `Record<ProblemType, …>`, so a new kind breaks the build until both handle it.
 */
export type ProblemType =
  | 'validation-error'
  | 'malformed-request'
  | 'resource-not-found'
  | 'route-not-found'
  | 'service-unavailable'
  | 'internal-error';

/** Where an invalid value was given. */
export type InvalidParamLocation = 'body' | 'query' | 'path';

/** One invalid value of a `validation-error`. */
export interface InvalidParam {
  in: InvalidParamLocation;
  /**
   * The value: a JSON Pointer (RFC 6901) into the body, e.g. `/title` or
   * `/stepIds/2`, or the name of the query or path parameter.
   */
  name: string;
  /** The rule broken, stable: e.g. `isNotEmpty`, `maxLength`, `isIn`, `whitelistValidation`. */
  code: string;
  /** What is wrong, in English. */
  detail: string;
  /** For `isIn`: the accepted values. */
  allowed?: string[];
  /** For `maxLength`: the maximum number of characters. */
  maxLength?: number;
}

/** Body of every error response. */
export interface ProblemDetails {
  /** `/problems/<ProblemType>`, or `about:blank`. */
  type: string;
  /** Short summary of the kind of problem; the same for every occurrence. */
  title: string;
  /** HTTP status code. */
  status: number;
  /** What happened this time, and what to do about it. */
  detail: string;
  /** Path of the request that failed. */
  instance: string;
  /** `validation-error`: every invalid value. */
  errors?: InvalidParam[];
  /** `resource-not-found`: the kind of resource that wasn't found. */
  resource?: 'offer' | 'interview-step';
}

/** Body of `GET /problems/:type`: what a kind of problem means. */
export interface ProblemTypeDescription {
  type: string;
  title: string;
  status: number;
  /** When it happens and how to fix the request. */
  description: string;
}
