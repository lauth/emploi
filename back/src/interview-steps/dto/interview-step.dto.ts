import type { InterviewStep, InterviewStepStatus } from '@emploi/shared';
import { ApiProperty } from '@nestjs/swagger';
import { INTERVIEW_STEP_PROPERTIES } from '../interview-step-api-properties.js';

/**
 * Response shape, for the OpenAPI document only: it implements the shared
 * type, so the documentation can't drift from what the API returns.
 */
export class InterviewStepDto implements InterviewStep {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'uuid',
    description: 'The offer the step belongs to.',
  })
  offerId: string;

  @ApiProperty(INTERVIEW_STEP_PROPERTIES.title)
  title: string;

  @ApiProperty(INTERVIEW_STEP_PROPERTIES.description)
  description: string | null;

  @ApiProperty(INTERVIEW_STEP_PROPERTIES.date)
  date: string | null;

  @ApiProperty(INTERVIEW_STEP_PROPERTIES.status)
  status: InterviewStepStatus;

  @ApiProperty({ format: 'date-time', example: '2026-10-01T08:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-02T09:45:00.000Z' })
  updatedAt: string;
}
