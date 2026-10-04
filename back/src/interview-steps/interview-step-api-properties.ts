import type { ApiPropertyOptions } from '@nestjs/swagger';
import {
  INTERVIEW_STEP_LIMITS,
  INTERVIEW_STEP_STATUSES,
} from './interview-step-fields.js';

/** OpenAPI description of each step field, shared by request and response DTOs. */
export const INTERVIEW_STEP_PROPERTIES = {
  title: {
    description: 'What the step is, free text. Trimmed.',
    maxLength: INTERVIEW_STEP_LIMITS.title,
    example: 'Entretien téléphonique RH',
  },
  description: {
    type: String,
    nullable: true,
    description: 'Notes: who, what was asked, feedback.',
    maxLength: INTERVIEW_STEP_LIMITS.description,
  },
  date: {
    type: String,
    nullable: true,
    format: 'date',
    description: 'Day of the step, `YYYY-MM-DD`; `null` until scheduled.',
    example: '2026-10-06',
  },
  status: {
    enum: INTERVIEW_STEP_STATUSES,
    enumName: 'InterviewStepStatus',
    description:
      '`planned`: to come; `pending`: done, waiting for the answer; ' +
      '`passed`: successful; `failed`: rejected at this step; ' +
      '`cancelled`: did not take place.',
    example: 'planned',
  },
} satisfies Record<string, ApiPropertyOptions>;
