import type {
  CreateInterviewStepRequest,
  CreateOfferRequest,
  InterviewStep,
  InterviewStepFieldLimits,
  InterviewStepStatus,
  Offer,
  OfferFieldLimits,
  ReorderInterviewStepsRequest,
  UpdateInterviewStepRequest,
  UpdateOfferRequest,
} from '@emploi/shared';
import { z } from 'zod';

// Schemas of the MCP tools. They mirror the API validation so the model gets
// immediate, precise errors; the API stays the authority.

/** `satisfies` makes the compiler reject any drift from the API limits. */
const OFFER_LIMITS = {
  title: 200,
  company: 200,
  url: 2048,
  location: 200,
  description: 20000,
} as const satisfies OfferFieldLimits;

const STEP_LIMITS = {
  title: 200,
  description: 20000,
} as const satisfies InterviewStepFieldLimits;

/** A Record must list every status: a new one breaks the build until described here. */
export const STATUS_DESCRIPTIONS: Record<InterviewStepStatus, string> = {
  planned: 'to come (scheduled or not yet)',
  pending: 'done, waiting for the answer',
  passed: 'successful, the process goes on',
  failed: 'rejected at this step',
  cancelled: 'did not take place',
};

const STATUSES = Object.keys(STATUS_DESCRIPTIONS) as [
  InterviewStepStatus,
  ...InterviewStepStatus[],
];

const statusHelp = Object.entries(STATUS_DESCRIPTIONS)
  .map(([status, meaning]) => `${status}: ${meaning}`)
  .join('; ');

// Fields

const id = (what: string) => z.uuid().describe(`Id of the ${what}.`);
const dateOnly = (description: string) =>
  z.iso.date().describe(`${description} Format YYYY-MM-DD.`);

const offerFields = {
  title: z
    .string()
    .trim()
    .min(1)
    .max(OFFER_LIMITS.title)
    .describe('Job title.'),
  company: z
    .string()
    .trim()
    .max(OFFER_LIMITS.company)
    .describe('Employer, if the offer names it.'),
  url: z
    .url({ protocol: /^https?$/ })
    .max(OFFER_LIMITS.url)
    .describe('Link to the offer (http or https).'),
  location: z
    .string()
    .trim()
    .max(OFFER_LIMITS.location)
    .describe('City, country or "Remote".'),
  description: z
    .string()
    .max(OFFER_LIMITS.description)
    .describe('Text of the offer.'),
  appliedAt: dateOnly('Day the user responded to the offer.'),
};

const stepFields = {
  title: z
    .string()
    .trim()
    .min(1)
    .max(STEP_LIMITS.title)
    .describe(
      'What the step is, e.g. "Phone screen with HR", "Technical test".',
    ),
  date: dateOnly('Day of the step.'),
  status: z.enum(STATUSES).describe(`Where the step stands. ${statusHelp}.`),
  description: z
    .string()
    .max(STEP_LIMITS.description)
    .describe('Notes: who, what was asked, feedback.'),
};

// Tool inputs: Zod objects (Standard Schema), as the MCP SDK v2 expects; raw
// shapes are deprecated in v2.

export const listOffersInput = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Offers per page (1-100).'),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Offers to skip, for the next pages.'),
});

export const offerIdInput = z.object({ offerId: id('offer') });

export const createOfferInput = z.object({
  title: offerFields.title,
  company: offerFields.company.optional(),
  url: offerFields.url.optional(),
  location: offerFields.location.optional(),
  description: offerFields.description.optional(),
  appliedAt: offerFields.appliedAt.optional(),
});

/** Absent fields are left unchanged; `null` clears an optional field. */
export const updateOfferInput = z.object({
  offerId: id('offer'),
  title: offerFields.title.optional(),
  company: offerFields.company.nullable().optional(),
  url: offerFields.url.nullable().optional(),
  location: offerFields.location.nullable().optional(),
  description: offerFields.description.nullable().optional(),
  appliedAt: offerFields.appliedAt.nullable().optional(),
});

export const addStepInput = z.object({
  offerId: id('offer'),
  title: stepFields.title,
  date: stepFields.date.optional(),
  status: stepFields.status
    .optional()
    .describe(`Defaults to planned. ${statusHelp}.`),
  description: stepFields.description.optional(),
});

/** Absent fields are left unchanged; `null` clears date or description. */
export const updateStepInput = z.object({
  offerId: id('offer'),
  stepId: id('interview step'),
  title: stepFields.title.optional(),
  date: stepFields.date.nullable().optional(),
  status: stepFields.status.optional(),
  description: stepFields.description.nullable().optional(),
});

export const reorderStepsInput = z.object({
  offerId: id('offer'),
  stepIds: z
    .array(z.uuid())
    .min(1)
    .describe(
      'Every step id of the offer, exactly once, in the new order (get_offer lists them).',
    ),
});

export const stepIdInput = z.object({
  offerId: id('offer'),
  stepId: id('interview step'),
});

// Tool outputs

const offerSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  company: z.string().nullable(),
  url: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  appliedAt: z.string().nullable().describe('YYYY-MM-DD'),
  createdAt: z.string().describe('ISO 8601 timestamp'),
  updatedAt: z.string().describe('ISO 8601 timestamp'),
});

const stepSchema = z.object({
  id: z.uuid(),
  offerId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.string().nullable().describe('YYYY-MM-DD'),
  status: z.enum(STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const offerOutput = z.object({ offer: offerSchema });

export const offerPageOutput = z.object({
  offers: z.array(offerSchema).describe('Newest first.'),
  total: z.number().int().describe('Offers across all pages.'),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const offerWithStepsOutput = z.object({
  offer: offerSchema,
  steps: z.array(stepSchema).describe('Interview steps, in order.'),
});

export const stepOutput = z.object({ step: stepSchema });

export const stepsOutput = z.object({
  steps: z.array(stepSchema).describe('Interview steps, in their new order.'),
});

export const deletedOutput = z.object({ deleted: z.literal(true) });

// Compile-time guards against drift from the API (shared types). When the back
// changes a request or response type, these fail the type check until the
// tools are updated. They are exported only so the linter sees them used.

/** `true` when A and B are the same type, checked both ways. */
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

/** Responses: a field added, removed, renamed or retyped in the API breaks the build. */
export type OfferSchemaMatchesApi = Assert<
  Equals<z.infer<typeof offerSchema>, Offer>
>;
export type StepSchemaMatchesApi = Assert<
  Equals<z.infer<typeof stepSchema>, InterviewStep>
>;

/** Requests: a field the API accepts but a tool can't send (or the reverse) breaks the build. */
type ToolFields<
  Schema extends z.ZodObject,
  Ids extends string = never,
> = Exclude<keyof z.infer<Schema>, Ids>;
export type CreateOfferInputMatchesApi = Assert<
  Equals<ToolFields<typeof createOfferInput>, keyof CreateOfferRequest>
>;
export type UpdateOfferInputMatchesApi = Assert<
  Equals<
    ToolFields<typeof updateOfferInput, 'offerId'>,
    keyof UpdateOfferRequest
  >
>;
export type AddStepInputMatchesApi = Assert<
  Equals<
    ToolFields<typeof addStepInput, 'offerId'>,
    keyof CreateInterviewStepRequest
  >
>;
export type UpdateStepInputMatchesApi = Assert<
  Equals<
    ToolFields<typeof updateStepInput, 'offerId' | 'stepId'>,
    keyof UpdateInterviewStepRequest
  >
>;
export type ReorderStepsInputMatchesApi = Assert<
  Equals<
    ToolFields<typeof reorderStepsInput, 'offerId'>,
    keyof ReorderInterviewStepsRequest
  >
>;
