import type {
  InvalidParam,
  InvalidParamLocation,
  ProblemDetails,
} from '@emploi/shared';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiProperty,
  ApiPropertyOptional,
  ApiServiceUnavailableResponse,
  getSchemaPath,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import { PROBLEM_CONTENT_TYPE } from '../problems/problem.filter.js';
import {
  interviewStepNotFound,
  offerNotFound,
  ProblemException,
  validationProblem,
} from '../problems/problem.exception.js';
import { describeProblemType } from '../problems/problem-types.js';

// Error responses in the OpenAPI document: RFC 9457 Problem Details
// (adrs/0024-problem-details-errors.md). Examples are built by the functions
// that raise the real errors, so they can't drift.

const LOCATIONS: Record<InvalidParamLocation, true> = {
  body: true,
  query: true,
  path: true,
};

export class InvalidParamDto implements InvalidParam {
  @ApiProperty({ enum: Object.keys(LOCATIONS) })
  in: InvalidParamLocation;

  @ApiProperty({
    description:
      'JSON Pointer (RFC 6901) into the body, e.g. `/title`, or the query or path parameter name.',
    example: '/title',
  })
  name: string;

  @ApiProperty({
    description:
      'Rule broken, stable: e.g. `isNotEmpty`, `maxLength`, `isIn`, `isUuid`, `whitelistValidation` (unknown field: remove it).',
    example: 'isNotEmpty',
  })
  code: string;

  @ApiProperty({ example: 'title should not be empty' })
  detail: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'For `isIn`: the accepted values.',
  })
  allowed?: string[];

  @ApiPropertyOptional({
    type: 'integer',
    description: 'For `maxLength`: the maximum number of characters.',
  })
  maxLength?: number;
}

export class ProblemDetailsDto implements ProblemDetails {
  @ApiProperty({
    description:
      'Kind of problem: `/problems/<kind>`, relative to the API (`GET` it for what it means and how to fix the request), or `about:blank`.',
    example: '/problems/validation-error',
  })
  type: string;

  @ApiProperty({ description: 'Summary of the kind of problem.' })
  title: string;

  @ApiProperty({ type: 'integer', description: 'HTTP status code.' })
  status: number;

  @ApiProperty({
    description: 'What happened this time, and what to do about it.',
  })
  detail: string;

  @ApiProperty({ description: 'Path of the request that failed.' })
  instance: string;

  @ApiPropertyOptional({
    type: [InvalidParamDto],
    description: '`validation-error`: every invalid value.',
  })
  errors?: InvalidParamDto[];

  @ApiPropertyOptional({
    enum: ['offer', 'interview-step'],
    description: '`resource-not-found`: the kind of resource not found.',
  })
  resource?: 'offer' | 'interview-step';
}

const EXAMPLE_PATH = '/offers/0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const EXAMPLE_OFFER_ID = '0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';
const EXAMPLE_STEP_ID = '0199a7a4-3c2e-7b6a-9c1d-00000000000a';

/** The response body a ProblemException gives, for examples. */
function example(exception: ProblemException): ProblemDetails {
  const { type, title, status } = describeProblemType(exception.problemType);
  return {
    type,
    title,
    status,
    detail: exception.detail,
    instance: EXAMPLE_PATH,
    ...exception.extras,
  };
}

/** Response options with a Problem Details body. */
function problemResponse(
  description: string,
  body: ProblemDetails,
): ApiResponseOptions {
  return {
    description,
    content: {
      [PROBLEM_CONTENT_TYPE]: {
        schema: { $ref: getSchemaPath(ProblemDetailsDto) },
        example: body,
      },
    },
  };
}

/** 400 `validation-error`: the body, query or an id is invalid. */
export const ApiInvalidRequest = () =>
  applyDecorators(
    ApiExtraModels(ProblemDetailsDto, InvalidParamDto),
    ApiBadRequestResponse(
      problemResponse(
        'Invalid request (`validation-error`): `errors` lists every invalid value of the body, query or path. Also `malformed-request` when the body is not valid JSON.',
        example(
          validationProblem([
            {
              in: 'body',
              name: '/title',
              code: 'isNotEmpty',
              detail: 'title should not be empty',
            },
            {
              in: 'body',
              name: '/status',
              code: 'isIn',
              detail:
                'status must be one of the following values: applied, interviewing',
              allowed: ['applied', 'interviewing'],
            },
          ]),
        ),
      ),
    ),
  );

/** 404 `resource-not-found` for an offer or an interview step. */
export const ApiNotFound = (resource: 'offer' | 'interview-step') =>
  applyDecorators(
    ApiExtraModels(ProblemDetailsDto, InvalidParamDto),
    ApiNotFoundResponse(
      resource === 'offer'
        ? problemResponse(
            'No offer with this id (`resource-not-found`).',
            example(offerNotFound(EXAMPLE_OFFER_ID)),
          )
        : problemResponse(
            'The offer has no step with this id, or there is no such offer (`resource-not-found`, `resource` says which).',
            example(interviewStepNotFound(EXAMPLE_OFFER_ID, EXAMPLE_STEP_ID)),
          ),
    ),
  );

/** 404 `route-not-found` of `GET /problems/{type}`. */
export const ApiNoSuchProblemType = () =>
  applyDecorators(
    ApiExtraModels(ProblemDetailsDto, InvalidParamDto),
    ApiNotFoundResponse(
      problemResponse('No kind of problem has this name (`route-not-found`).', {
        ...example(
          new ProblemException(
            'route-not-found',
            'No kind of problem is called "oops". The kinds are: validation-error, ….',
          ),
        ),
        instance: '/problems/oops',
      }),
    ),
  );

/** 503 `service-unavailable`. */
export const ApiUnavailable = (description: string, detail: string) =>
  applyDecorators(
    ApiExtraModels(ProblemDetailsDto, InvalidParamDto),
    ApiServiceUnavailableResponse(
      problemResponse(
        description,
        example(new ProblemException('service-unavailable', detail)),
      ),
    ),
  );
