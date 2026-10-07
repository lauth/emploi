import type { ProblemTypeDescription } from '@emploi/shared';
import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { ApiNoSuchProblemType } from '../common/api-docs.js';
import { ProblemException } from './problem.exception.js';
import {
  describeProblemType,
  isProblemType,
  PROBLEM_TYPES,
} from './problem-types.js';

class ProblemTypeDescriptionDto implements ProblemTypeDescription {
  @ApiProperty({ example: '/problems/validation-error' })
  type: string;

  @ApiProperty({ example: 'Invalid request' })
  title: string;

  @ApiProperty({ type: 'integer', example: 400 })
  status: number;

  @ApiProperty({ description: 'When it happens and how to fix the request.' })
  description: string;
}

/**
 * Documentation of the `type` of error responses: `/problems/<kind>` is
 * relative to the API, and GET on it says what the problem means
 * (adrs/0024-problem-details-errors.md).
 */
@ApiTags('problems')
@Controller('problems')
export class ProblemsController {
  @Get()
  @ApiOperation({ summary: 'List the kinds of error the API answers with' })
  @ApiOkResponse({ type: [ProblemTypeDescriptionDto] })
  list(): ProblemTypeDescription[] {
    return PROBLEM_TYPES.map(describeProblemType);
  }

  @Get(':type')
  @ApiOperation({
    summary: 'Describe a kind of error: when it happens and how to fix it',
  })
  @ApiParam({ name: 'type', enum: PROBLEM_TYPES })
  @ApiOkResponse({ type: ProblemTypeDescriptionDto })
  @ApiNoSuchProblemType()
  get(@Param('type') type: string): ProblemTypeDescription {
    if (!isProblemType(type)) {
      throw new ProblemException(
        'route-not-found',
        `No kind of problem is called "${type}". The kinds are: ${PROBLEM_TYPES.join(', ')}.`,
      );
    }
    return describeProblemType(type);
  }
}
