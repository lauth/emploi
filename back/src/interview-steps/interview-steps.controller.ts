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
import { CreateInterviewStepDto } from './dto/create-interview-step.dto.js';
import { ReorderInterviewStepsDto } from './dto/reorder-interview-steps.dto.js';
import { UpdateInterviewStepDto } from './dto/update-interview-step.dto.js';
import { InterviewStepsService } from './interview-steps.service.js';

@Controller('offers/:offerId/steps')
export class InterviewStepsController {
  constructor(private readonly steps: InterviewStepsService) {}

  @Get()
  list(
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ): Promise<InterviewStep[]> {
    return this.steps.list(offerId);
  }

  @Post()
  create(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() body: CreateInterviewStepDto,
  ): Promise<InterviewStep> {
    return this.steps.create(offerId, body);
  }

  @Put('order')
  reorder(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Body() body: ReorderInterviewStepsDto,
  ): Promise<InterviewStep[]> {
    return this.steps.reorder(offerId, body.stepIds);
  }

  @Get(':stepId')
  get(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<InterviewStep> {
    return this.steps.get(offerId, stepId);
  }

  @Patch(':stepId')
  update(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() body: UpdateInterviewStepDto,
  ): Promise<InterviewStep> {
    return this.steps.update(offerId, stepId, body);
  }

  @Delete(':stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<void> {
    return this.steps.remove(offerId, stepId);
  }
}
