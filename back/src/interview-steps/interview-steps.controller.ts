import type { InterviewStep } from '@emploi/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { CreateInterviewStepDto } from './dto/create-interview-step.dto.js';
import { InterviewStepDto } from './dto/interview-step.dto.js';
import { ReorderInterviewStepsDto } from './dto/reorder-interview-steps.dto.js';
import { UpdateInterviewStepDto } from './dto/update-interview-step.dto.js';
import { InterviewStepsService } from './interview-steps.service.js';

const OFFER_NOT_FOUND = 'No offer with this id.';
const OFFER_NOT_FOUND_MESSAGE =
  'Offer 0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d not found';
const STEP_NOT_FOUND = 'No such step for this offer.';
const STEP_NOT_FOUND_MESSAGE =
  'Interview step 0199a7a4-3c2e-7b6a-9c1d-00000000000a not found for offer 0199a7a4-3c2e-7b6a-9c1d-2f3e4a5b6c7d';

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
  @ApiNotFound(OFFER_NOT_FOUND, OFFER_NOT_FOUND_MESSAGE)
  list(
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ): Promise<InterviewStep[]> {
    return this.steps.list(offerId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a step after the existing ones' })
  @ApiCreatedResponse({ type: InterviewStepDto })
  @ApiInvalidRequest()
  @ApiNotFound(OFFER_NOT_FOUND, OFFER_NOT_FOUND_MESSAGE)
  create(
    @Param('offerId', ParseUUIDPipe) offerId: string,
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
  @ApiNotFound(OFFER_NOT_FOUND, OFFER_NOT_FOUND_MESSAGE)
  reorder(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() body: ReorderInterviewStepsDto,
  ): Promise<InterviewStep[]> {
    return this.steps.reorder(offerId, body.stepIds);
  }

  @Get(':stepId')
  @ApiOperation({ summary: 'Get a step' })
  @STEP_ID
  @ApiOkResponse({ type: InterviewStepDto })
  @ApiInvalidRequest()
  @ApiNotFound(STEP_NOT_FOUND, STEP_NOT_FOUND_MESSAGE)
  get(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
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
  @ApiNotFound(STEP_NOT_FOUND, STEP_NOT_FOUND_MESSAGE)
  update(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
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
  @ApiNotFound(STEP_NOT_FOUND, STEP_NOT_FOUND_MESSAGE)
  remove(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<void> {
    return this.steps.remove(offerId, stepId);
  }
}
