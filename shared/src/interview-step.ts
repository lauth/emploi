// Interview steps API (adrs/0015-interview-step-data-model-and-api.md).

/**
 * Where a step stands. Each side derives its runtime list from a
 * `Record<InterviewStepStatus, …>`, so adding a status here breaks the build
 * until both handle it.
 */
export type InterviewStepStatus =
  'planned' | 'pending' | 'passed' | 'failed' | 'cancelled';

/** A step of the interview process of an offer, as returned by the API. */
export interface InterviewStep {
  id: string;
  offerId: string;
  title: string;
  description: string | null;
  /** Day of the step, `YYYY-MM-DD`; `null` until scheduled. */
  date: string | null;
  status: InterviewStepStatus;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/** Body of `POST /offers/:offerId/steps`. The step is added last. */
export interface CreateInterviewStepRequest {
  title: string;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  date?: string | null;
  /** Default `planned`. */
  status?: InterviewStepStatus;
}

/**
 * Body of `PATCH /offers/:offerId/steps/:stepId`. Absent fields are left
 * unchanged; `null` clears an optional field.
 */
export interface UpdateInterviewStepRequest {
  title?: string;
  description?: string | null;
  /** `YYYY-MM-DD`. */
  date?: string | null;
  status?: InterviewStepStatus;
}

/** Body of `PUT /offers/:offerId/steps/order`: every step id of the offer, in the new order. */
export interface ReorderInterviewStepsRequest {
  stepIds: string[];
}

/** Maximum lengths enforced by the API. */
export interface InterviewStepFieldLimits {
  title: 200;
  description: 20000;
}
