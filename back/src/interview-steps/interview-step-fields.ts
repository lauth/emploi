import type {
  InterviewStepFieldLimits,
  InterviewStepStatus,
} from '@emploi/shared';

/** `satisfies` makes the compiler reject any drift from the shared limits. */
export const INTERVIEW_STEP_LIMITS = {
  title: 200,
  description: 20000,
} as const satisfies InterviewStepFieldLimits;

// A Record must list every status, and only those: a status added to the
// shared type breaks the build until it is handled here.
const STATUSES: Record<InterviewStepStatus, true> = {
  planned: true,
  pending: true,
  passed: true,
  failed: true,
  cancelled: true,
};

export const INTERVIEW_STEP_STATUSES = Object.keys(
  STATUSES,
) as InterviewStepStatus[];
