import type {
  CreateInterviewStepRequest,
  InterviewStepFieldLimits,
  InterviewStepStatus,
} from '@emploi/shared';
import { z } from 'zod';
import {
  initialFormState,
  optionalDate,
  optionalText,
  parseForm,
  readForm,
  requiredText,
  type FormState,
  type ParseResult,
} from './forms';

/** `satisfies` makes the compiler reject any drift from the API limits. */
export const INTERVIEW_STEP_LIMITS = {
  title: 200,
  description: 20000,
} as const satisfies InterviewStepFieldLimits;

/**
 * Labels of the statuses, in the order of the select. A Record must list every
 * status: one added to the shared type breaks the build until it has a label.
 */
export const INTERVIEW_STEP_STATUS_LABELS: Record<InterviewStepStatus, string> =
  {
    planned: 'Planned',
    pending: 'Waiting for an answer',
    passed: 'Passed',
    failed: 'Rejected',
    cancelled: 'Cancelled',
  };

const STATUSES = Object.keys(INTERVIEW_STEP_STATUS_LABELS) as [
  InterviewStepStatus,
  ...InterviewStepStatus[],
];

export const INTERVIEW_STEP_FIELDS = [
  'title',
  'date',
  'status',
  'description',
] as const;

export type InterviewStepField = (typeof INTERVIEW_STEP_FIELDS)[number];

/** Raw form values, as typed by the user. */
export type InterviewStepFormValues = Record<InterviewStepField, string>;

export type InterviewStepFormState = FormState<InterviewStepField>;

export const EMPTY_INTERVIEW_STEP_FORM: InterviewStepFormValues = {
  title: '',
  date: '',
  status: 'planned',
  description: '',
};

/** Mirrors the API validation (back/src/interview-steps/dto). */
export const interviewStepFormSchema = z.object({
  title: requiredText(INTERVIEW_STEP_LIMITS.title),
  date: optionalDate(),
  status: z.enum(STATUSES, 'Choose a status'),
  description: optionalText(INTERVIEW_STEP_LIMITS.description),
}) satisfies z.ZodType<
  Required<CreateInterviewStepRequest>,
  InterviewStepFormValues
>;

export function readInterviewStepForm(
  formData: FormData,
): InterviewStepFormValues {
  return readForm(formData, INTERVIEW_STEP_FIELDS);
}

export function initialInterviewStepFormState(
  values: InterviewStepFormValues,
): InterviewStepFormState {
  return initialFormState(values);
}

export function parseInterviewStepForm(
  values: InterviewStepFormValues,
): ParseResult<InterviewStepField, z.infer<typeof interviewStepFormSchema>> {
  return parseForm(interviewStepFormSchema, values);
}
