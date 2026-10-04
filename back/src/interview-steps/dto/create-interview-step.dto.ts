import type {
  CreateInterviewStepRequest,
  InterviewStepStatus,
} from '@emploi/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_ONLY_PATTERN } from '../../common/date-only.js';
import { Trim, TrimToNull } from '../../common/transforms.js';
import { IfPresent } from '../../common/validators.js';
import { INTERVIEW_STEP_PROPERTIES } from '../interview-step-api-properties.js';
import {
  INTERVIEW_STEP_LIMITS,
  INTERVIEW_STEP_STATUSES,
} from '../interview-step-fields.js';

export class CreateInterviewStepDto implements CreateInterviewStepRequest {
  @ApiProperty(INTERVIEW_STEP_PROPERTIES.title)
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(INTERVIEW_STEP_LIMITS.title)
  title: string;

  @ApiPropertyOptional(INTERVIEW_STEP_PROPERTIES.description)
  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(INTERVIEW_STEP_LIMITS.description)
  description?: string | null;

  @ApiPropertyOptional(INTERVIEW_STEP_PROPERTIES.date)
  @TrimToNull()
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'date must be a YYYY-MM-DD date' })
  @IsDateString({ strict: true })
  date?: string | null;

  /** Absent means `planned`; `null` is rejected. */
  @ApiPropertyOptional({
    ...INTERVIEW_STEP_PROPERTIES.status,
    default: 'planned',
  })
  @IfPresent()
  @IsIn(INTERVIEW_STEP_STATUSES)
  status?: InterviewStepStatus;
}
