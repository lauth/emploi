import type { InterviewStep } from '@emploi/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiInvalidRequest, ApiNotFound } from '../common/api-docs.js';
import { ParseIdPipe } from '../problems/validation.js';
import { CreateInterviewStepDto } from './dto/create-interview-step.dto.js';
import { InterviewStepDto } from './dto/interview-step.dto.js';
import { ReorderInterviewStepsDto } from './dto/reorder-interview-steps.dto.js';
import { UpdateInterviewStepDto } from './dto/update-interview-step.dto.js';
import { InterviewStepsService } from './interview-steps.service.js';

const OFFER_ID = ApiParam({
  name: 'offerId',
  format: 'uuid',
  description: 'Offer id.',
});
const STEP_ID = ApiParam({
  name: 'stepId',
  format: 'uuid',
  description: 'Interview step id.',
});

@ApiTags('interview-steps')
@OFFER_ID
@Controller('offers/:offerId/steps')
export class InterviewStepsController {
  constructor(private readonly steps: InterviewStepsService) {}

  @Get()
  @ApiOperation({ summary: 'List the steps of an offer, in order' })
  @ApiOkResponse({ type: [InterviewStepDto] })
  @ApiInvalidRequest()
  @ApiNotFound('offer')
  list(
    @Param('offerId', ParseIdPipe) offerId: string,
  ): Promise<InterviewStep[]> {
    return this.steps.list(offerId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a step after the existing ones' })
  @ApiCreatedResponse({ type: InterviewStepDto })
  @ApiInvalidRequest()
  @ApiNotFound('offer')
  create(
    @Param('offerId', ParseIdPipe) offerId: string,
    @Body() body: CreateInterviewStepDto,
  ): Promise<InterviewStep> {
    return this.steps.create(offerId, body);
  }

  @Put('order')
  @ApiOperation({
    summary: 'Reorder the steps of an offer',
    description:
      'Replaces the whole order at once. The list must contain every step of the offer exactly once.',
  })
  @ApiOkResponse({
    type: [InterviewStepDto],
    description: 'The steps in their new order.',
  })
  @ApiInvalidRequest()
  @ApiNotFound('offer')
  reorder(
    @Param('offerId', ParseIdPipe) offerId: string,
    @Body() body: ReorderInterviewStepsDto,
  ): Promise<InterviewStep[]> {
    return this.steps.reorder(offerId, body.stepIds);
  }

  @Get(':stepId')
  @ApiOperation({ summary: 'Get a step' })
  @STEP_ID
  @ApiOkResponse({ type: InterviewStepDto })
  @ApiInvalidRequest()
  @ApiNotFound('interview-step')
  get(
    @Param('offerId', ParseIdPipe) offerId: string,
    @Param('stepId', ParseIdPipe) stepId: string,
  ): Promise<InterviewStep> {
    return this.steps.get(offerId, stepId);
  }

  @Patch(':stepId')
  @ApiOperation({
    summary: 'Update a step',
    description:
      'Partial update: absent fields are left unchanged, `null` clears an optional field.',
  })
  @STEP_ID
  @ApiOkResponse({ type: InterviewStepDto })
  @ApiInvalidRequest()
  @ApiNotFound('interview-step')
  update(
    @Param('offerId', ParseIdPipe) offerId: string,
    @Param('stepId', ParseIdPipe) stepId: string,
    @Body() body: UpdateInterviewStepDto,
  ): Promise<InterviewStep> {
    return this.steps.update(offerId, stepId, body);
  }

  @Delete(':stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a step' })
  @STEP_ID
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiInvalidRequest()
  @ApiNotFound('interview-step')
  remove(
    @Param('offerId', ParseIdPipe) offerId: string,
    @Param('stepId', ParseIdPipe) stepId: string,
  ): Promise<void> {
    return this.steps.remove(offerId, stepId);
  }
}
