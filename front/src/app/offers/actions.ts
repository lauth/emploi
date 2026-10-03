'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, createOffer, deleteOffer, updateOffer } from '@/lib/api';
import {
  parseOfferForm,
  readOfferForm,
  type OfferFormState,
} from '@/lib/offer-form';

// Server actions are reachable by direct POST requests: every input is
// validated here, and again by the API.

export async function createOfferAction(
  _previous: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const values = readOfferForm(formData);
  const parsed = parseOfferForm(values);
  if (!parsed.success) {
    return { values, fieldErrors: parsed.fieldErrors, formErrors: [] };
  }

  let id: string;
  try {
    ({ id } = await createOffer(parsed.data));
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: errorMessages(error) };
  }

  revalidatePath('/offers');
  redirect(`/offers/${id}`);
}

export async function updateOfferAction(
  id: string,
  _previous: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const values = readOfferForm(formData);
  const parsed = parseOfferForm(values);
  if (!parsed.success) {
    return { values, fieldErrors: parsed.fieldErrors, formErrors: [] };
  }

  try {
    await updateOffer(id, parsed.data);
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: errorMessages(error) };
  }

  revalidatePath('/offers');
  redirect(`/offers/${id}`);
}

export async function deleteOfferAction(id: string): Promise<void> {
  try {
    await deleteOffer(id);
  } catch (error) {
    // Already gone (404) or not an offer id (400): nothing to delete.
    if (!(error instanceof ApiError && [400, 404].includes(error.status))) {
      throw error;
    }
  }

  revalidatePath('/offers');
  redirect('/offers');
}

/** Messages shown above the form when the API rejects or fails a request. */
function errorMessages(error: unknown): string[] {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return ['This offer no longer exists.'];
    }
    if (error.status === 400) {
      return error.messages;
    }
  }
  console.error(error);
  return ['The offer could not be saved. Please try again.'];
}
