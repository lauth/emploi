'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { saveErrorMessages, validationTranslator } from '@/lib/action-helpers';
import { createOffer, deleteOffer, isNotFound, updateOffer } from '@/lib/api';
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
  const parsed = parseOfferForm(values, await validationTranslator());
  if (!parsed.success) {
    return { values, fieldErrors: parsed.fieldErrors, formErrors: [] };
  }

  let id: string;
  try {
    ({ id } = await createOffer(parsed.data));
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: await errorMessages(error) };
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
  const parsed = parseOfferForm(values, await validationTranslator());
  if (!parsed.success) {
    return { values, fieldErrors: parsed.fieldErrors, formErrors: [] };
  }

  try {
    await updateOffer(id, parsed.data);
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: await errorMessages(error) };
  }

  revalidatePath('/offers');
  redirect(`/offers/${id}`);
}

export async function deleteOfferAction(id: string): Promise<void> {
  try {
    await deleteOffer(id);
  } catch (error) {
    // Already gone (404) or not an offer id (400): nothing to delete.
    if (!isNotFound(error)) {
      throw error;
    }
  }

  revalidatePath('/offers');
  redirect('/offers');
}

async function errorMessages(error: unknown): Promise<string[]> {
  const t = await getTranslations('offers.errors');
  return saveErrorMessages(error, {
    notFound: t('notFound'),
    failed: t('failed'),
  });
}
