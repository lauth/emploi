import type { CreateOfferRequest, OfferFieldLimits } from '@emploi/shared';
import { z } from 'zod';

/** `satisfies` makes the compiler reject any drift from the API limits. */
export const OFFER_LIMITS = {
  title: 200,
  company: 200,
  url: 2048,
  location: 200,
  description: 20000,
} as const satisfies OfferFieldLimits;

export const OFFER_FIELDS = [
  'title',
  'company',
  'url',
  'location',
  'description',
  'appliedAt',
] as const;

export type OfferField = (typeof OFFER_FIELDS)[number];

/** Raw form values, as typed by the user. */
export type OfferFormValues = Record<OfferField, string>;

export const EMPTY_OFFER_FORM: OfferFormValues = {
  title: '',
  company: '',
  url: '',
  location: '',
  description: '',
  appliedAt: '',
};

function isHttpUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }
  const { protocol } = new URL(value);
  return protocol === 'http:' || protocol === 'https:';
}

/** `YYYY-MM-DD` and an existing day (rejects 2026-02-30). */
function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const tooLong = (max: number) => `At most ${String(max)} characters`;

const required = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, tooLong(max));

/** Empty input means "no value": `null`, which also clears it on update. */
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, tooLong(max))
    .transform((value) => (value === '' ? null : value));

/** Mirrors the API validation (back/src/offers/dto) for immediate feedback. */
export const offerFormSchema = z.object({
  title: required(OFFER_LIMITS.title),
  company: required(OFFER_LIMITS.company),
  url: optional(OFFER_LIMITS.url).refine(
    (value) => value === null || isHttpUrl(value),
    'Must be an http:// or https:// URL',
  ),
  location: optional(OFFER_LIMITS.location),
  description: optional(OFFER_LIMITS.description),
  appliedAt: z
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .refine((value) => value === null || isDateOnly(value), 'Must be a date'),
}) satisfies z.ZodType<Required<CreateOfferRequest>, OfferFormValues>;

/** Reads the offer fields of a submitted form; missing fields are empty. */
export function readOfferForm(formData: FormData): OfferFormValues {
  const values = { ...EMPTY_OFFER_FORM };
  for (const field of OFFER_FIELDS) {
    const value = formData.get(field);
    values[field] = typeof value === 'string' ? value : '';
  }
  return values;
}

/** State of the offer form between submissions (`useActionState`). */
export interface OfferFormState {
  /** Submitted values, so the form keeps what the user typed after an error. */
  values: OfferFormValues;
  fieldErrors: Partial<Record<OfferField, string[]>>;
  /** Errors not tied to a field, e.g. answered by the API. */
  formErrors: string[];
}

export function initialOfferFormState(values: OfferFormValues): OfferFormState {
  return { values, fieldErrors: {}, formErrors: [] };
}

export type OfferFormResult =
  | { success: true; data: z.infer<typeof offerFormSchema> }
  | { success: false; fieldErrors: Partial<Record<OfferField, string[]>> };

export function parseOfferForm(values: OfferFormValues): OfferFormResult {
  const result = offerFormSchema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    fieldErrors: z.flattenError(result.error).fieldErrors,
  };
}
