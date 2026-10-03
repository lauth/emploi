import type {
  CreateInterviewStepRequest,
  InterviewStepStatus,
} from '@emploi/shared';
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
import {
  INTERVIEW_STEP_LIMITS,
  INTERVIEW_STEP_STATUSES,
} from '../interview-step-fields.js';

export class CreateInterviewStepDto implements CreateInterviewStepRequest {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(INTERVIEW_STEP_LIMITS.title)
  title: string;

  @TrimToNull()
  @IsOptional()
  @IsString()
  @MaxLength(INTERVIEW_STEP_LIMITS.description)
  description?: string | null;

  @TrimToNull()
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'date must be a YYYY-MM-DD date' })
  @IsDateString({ strict: true })
  date?: string | null;

  /** Absent means `planned`; `null` is rejected. */
  @IfPresent()
  @IsIn(INTERVIEW_STEP_STATUSES)
  status?: InterviewStepStatus;
}
