import { z } from 'zod';

// Building blocks of the feature forms (offers, interview steps): raw values
// read from FormData, Zod schemas mirroring the API validation, and the state
// kept by `useActionState` between submissions.

/** State of a form between submissions. */
export interface FormState<Field extends string> {
  /** Submitted values, so the form keeps what the user typed after an error. */
  values: Record<Field, string>;
  fieldErrors: Partial<Record<Field, string[]>>;
  /** Errors not tied to a field, e.g. answered by the API. */
  formErrors: string[];
}

export function initialFormState<Field extends string>(
  values: Record<Field, string>,
): FormState<Field> {
  return { values, fieldErrors: {}, formErrors: [] };
}

/** Reads the given fields of a submitted form; missing fields are empty. */
export function readForm<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  const entries = fields.map((field) => {
    const value = formData.get(field);
    return [field, typeof value === 'string' ? value : ''] as const;
  });
  return Object.fromEntries(entries) as Record<Field, string>;
}

export type ParseResult<Field extends string, Output> =
  | { success: true; data: Output }
  | { success: false; fieldErrors: Partial<Record<Field, string[]>> };

export function parseForm<Field extends string, Output>(
  schema: z.ZodType<Output, Record<Field, string>>,
  values: Record<Field, string>,
): ParseResult<Field, Output> {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const isField = (key: PropertyKey | undefined): key is Field =>
    typeof key === 'string' && Object.hasOwn(values, key);
  const fieldErrors: Partial<Record<Field, string[]>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (isField(field)) {
      (fieldErrors[field] ??= []).push(issue.message);
    }
  }
  return { success: false, fieldErrors };
}

// Schema helpers

const tooLong = (max: number) => `At most ${String(max)} characters`;

const emptyToNull = (value: string) => (value === '' ? null : value);

export const requiredText = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, tooLong(max));

/** Empty input means "no value": `null`, which also clears it on update. */
export const optionalText = (max: number) =>
  z.string().trim().max(max, tooLong(max)).transform(emptyToNull);

export const optionalHttpUrl = (max: number) =>
  optionalText(max).refine(
    (value) => value === null || isHttpUrl(value),
    'Must be an http:// or https:// URL',
  );

/** `YYYY-MM-DD` (what `<input type="date">` submits), or empty. */
export const optionalDate = () =>
  z
    .string()
    .trim()
    .transform(emptyToNull)
    .refine((value) => value === null || isDateOnly(value), 'Must be a date');

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
