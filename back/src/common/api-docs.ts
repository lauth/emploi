import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

/** Body of NestJS error responses (400, 404, 503). */
export class ApiErrorDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty({
    description: 'One message, or one per validation problem.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiPropertyOptional({ description: 'HTTP reason phrase.' })
  error?: string;
}

/** 400: the body, query or an id is invalid. */
export const ApiInvalidRequest = () =>
  ApiBadRequestResponse({
    type: ApiErrorDto,
    description: 'Invalid request: malformed id, body or query.',
    example: {
      statusCode: 400,
      message: ['title should not be empty'],
      error: 'Bad Request',
    } satisfies ApiErrorDto,
  });

/** 404, with the description and message of the missing resource. */
export const ApiNotFound = (description: string, message: string) =>
  ApiNotFoundResponse({
    type: ApiErrorDto,
    description,
    example: {
      statusCode: 404,
      message,
      error: 'Not Found',
    } satisfies ApiErrorDto,
  });
