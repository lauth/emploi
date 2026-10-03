import type {
  CreateInterviewStepRequest,
  InterviewStepFieldLimits,
  InterviewStepStatus,
} from '@emploi/shared';
import { z } from 'zod';
import {
  choice,
  initialFormState,
  optionalDate,
  optionalText,
  parseForm,
  readForm,
  requiredText,
  type FormState,
  type ParseResult,
  type TranslateValidation,
} from './forms';

/** `satisfies` makes the compiler reject any drift from the API limits. */
export const INTERVIEW_STEP_LIMITS = {
  title: 200,
  description: 20000,
} as const satisfies InterviewStepFieldLimits;

// A Record must list every status, and only those: a status added to the
// shared type breaks the build until it is handled here. Key order is the
// order of the select; labels are in the catalogue (`steps.status.*`).
const STATUSES: Record<InterviewStepStatus, true> = {
  planned: true,
  pending: true,
  passed: true,
  failed: true,
  cancelled: true,
};

export const INTERVIEW_STEP_STATUSES = Object.keys(STATUSES) as [
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
  status: choice(INTERVIEW_STEP_STATUSES),
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
  translate: TranslateValidation,
): ParseResult<InterviewStepField, z.infer<typeof interviewStepFormSchema>> {
  return parseForm(interviewStepFormSchema, values, translate);
}
