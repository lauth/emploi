import type { CreateOfferRequest, OfferFieldLimits } from '@emploi/shared';
import { z } from 'zod';
import {
  initialFormState,
  optionalDate,
  optionalHttpUrl,
  optionalText,
  parseForm,
  readForm,
  requiredText,
  type FormState,
  type ParseResult,
  type TranslateValidation,
} from './forms';

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

export type OfferFormState = FormState<OfferField>;

export const EMPTY_OFFER_FORM: OfferFormValues = {
  title: '',
  company: '',
  url: '',
  location: '',
  description: '',
  appliedAt: '',
};

/** Mirrors the API validation (back/src/offers/dto) for immediate feedback. */
export const offerFormSchema = z.object({
  title: requiredText(OFFER_LIMITS.title),
  company: optionalText(OFFER_LIMITS.company),
  url: optionalHttpUrl(OFFER_LIMITS.url),
  location: optionalText(OFFER_LIMITS.location),
  description: optionalText(OFFER_LIMITS.description),
  appliedAt: optionalDate(),
}) satisfies z.ZodType<Required<CreateOfferRequest>, OfferFormValues>;

export function readOfferForm(formData: FormData): OfferFormValues {
  return readForm(formData, OFFER_FIELDS);
}

export function initialOfferFormState(values: OfferFormValues): OfferFormState {
  return initialFormState(values);
}

export function parseOfferForm(
  values: OfferFormValues,
  translate: TranslateValidation,
): ParseResult<OfferField, z.infer<typeof offerFormSchema>> {
  return parseForm(offerFormSchema, values, translate);
}
