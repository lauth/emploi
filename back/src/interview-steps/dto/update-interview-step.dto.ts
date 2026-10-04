import type {
  InterviewStepStatus,
  UpdateInterviewStepRequest,
} from '@emploi/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
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

/**
 * Partial update: absent fields are left unchanged, `null` clears an optional
 * field; `title` and `status` can't be cleared.
 */
export class UpdateInterviewStepDto implements UpdateInterviewStepRequest {
  @ApiPropertyOptional(INTERVIEW_STEP_PROPERTIES.title)
  @Trim()
  @IfPresent()
  @IsString()
  @IsNotEmpty()
  @MaxLength(INTERVIEW_STEP_LIMITS.title)
  title?: string;

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

  @ApiPropertyOptional(INTERVIEW_STEP_PROPERTIES.status)
  @IfPresent()
  @IsIn(INTERVIEW_STEP_STATUSES)
  status?: InterviewStepStatus;
}
