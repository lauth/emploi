import { STATUS_CODES } from 'node:http';
import type { ProblemDetails, ProblemType } from '@emploi/shared';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProblemException } from './problem.exception.js';
import { describeProblemType } from './problem-types.js';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** Kinds of problem for the HTTP errors Nest and Express raise themselves. */
const FRAMEWORK_PROBLEMS: Partial<Record<number, ProblemType>> = {
  [HttpStatus.BAD_REQUEST]: 'malformed-request',
  [HttpStatus.NOT_FOUND]: 'route-not-found',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service-unavailable',
};

/** The message of a Nest HttpException, whatever the shape of its response. */
function messageOf(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  const { message } = response as { message?: unknown };
  return Array.isArray(message)
    ? message.join('; ')
    : typeof message === 'string'
      ? message
      : exception.message;
}

/**
 * Every error as RFC 9457 Problem Details (adrs/0024-problem-details-errors.md):
 * `ProblemException`s as raised, framework HTTP errors mapped to a kind of
 * problem (or `about:blank`), anything else as a logged `internal-error`.
 */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const instance = request.originalUrl.split('?')[0] ?? request.originalUrl;

    const problem = this.toProblem(exception, request.method, instance);
    response
      .status(problem.status)
      .type(PROBLEM_CONTENT_TYPE)
      .send(JSON.stringify(problem));
  }

  private toProblem(
    exception: unknown,
    method: string,
    instance: string,
  ): ProblemDetails {
    if (exception instanceof ProblemException) {
      const { type, title, status } = describeProblemType(
        exception.problemType,
      );
      return {
        type,
        title,
        status,
        detail: exception.detail,
        instance,
        ...exception.extras,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const kind = FRAMEWORK_PROBLEMS[status];
      const detail =
        kind === 'route-not-found'
          ? `No endpoint for ${method} ${instance}. The endpoints are listed in the OpenAPI document at /docs-json.`
          : messageOf(exception);
      if (kind !== undefined) {
        const { type, title } = describeProblemType(kind);
        return { type, title, status, detail, instance };
      }
      // RFC 9457: `about:blank` means no more than the HTTP status, and its
      // title is the status phrase.
      return {
        type: 'about:blank',
        title: STATUS_CODES[status] ?? 'Error',
        status,
        detail,
        instance,
      };
    }

    this.logger.error(
      `${method} ${instance} failed`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    const { type, title, status } = describeProblemType('internal-error');
    return {
      type,
      title,
      status,
      detail:
        'The API failed unexpectedly. Try again later; the error is logged on the server.',
      instance,
    };
  }
}
