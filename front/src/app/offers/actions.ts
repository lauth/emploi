'use server';

import type { CreateOfferRequest } from '@emploi/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { saveErrorMessages, validationTranslator } from '@/lib/action-helpers';
import {
  createOffer,
  deleteOffer,
  deleteOfferImage,
  isNotFound,
  putOfferImage,
  updateOffer,
} from '@/lib/api';
import type { TranslateValidation } from '@/lib/forms';
import {
  parseOfferForm,
  readOfferForm,
  type OfferFormState,
  type OfferFormValues,
} from '@/lib/offer-form';
import {
  OFFER_IMAGE_MAX_MB,
  readOfferImage,
  type OfferImageResult,
} from '@/lib/offer-image';

// Server actions are reachable by direct POST requests: every input is
// validated here, and again by the API.

type Submission =
  | {
      valid: true;
      values: OfferFormValues;
      offer: Required<CreateOfferRequest>;
      image: File | null;
    }
  | { valid: false; invalid: OfferFormState };

/** The offer and its image (adrs/0031-offer-image.md), checked together. */
async function readSubmission(formData: FormData): Promise<Submission> {
  const values = readOfferForm(formData);
  const translate = await validationTranslator();
  const parsed = parseOfferForm(values, translate);
  const image = readOfferImage(formData);
  if (parsed.success && image.success) {
    return { valid: true, values, offer: parsed.data, image: image.image };
  }
  const invalid: OfferFormState = {
    values,
    fieldErrors: {
      ...(parsed.success ? {} : parsed.fieldErrors),
      ...imageErrors(image, translate),
    },
    formErrors: [],
  };
  return { valid: false, invalid };
}

function imageErrors(
  image: OfferImageResult,
  translate: TranslateValidation,
): OfferFormState['fieldErrors'] {
  return image.success
    ? {}
    : { image: [translate(image.error, { max: OFFER_IMAGE_MAX_MB })] };
}

export async function createOfferAction(
  _previous: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const submission = await readSubmission(formData);
  if (!submission.valid) {
    return submission.invalid;
  }
  const { values, offer, image } = submission;

  let id: string;
  try {
    ({ id } = await createOffer(offer));
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: await errorMessages(error) };
  }

  revalidatePath('/offers');
  if (image !== null && !(await saveImage(id, image))) {
    // The offer exists: sending the form again would create another one.
    redirect(`/offers/${id}/edit?image=failed`);
  }
  redirect(`/offers/${id}`);
}

export async function updateOfferAction(
  id: string,
  _previous: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const submission = await readSubmission(formData);
  if (!submission.valid) {
    return submission.invalid;
  }
  const { values, offer, image } = submission;

  try {
    await updateOffer(id, offer);
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: await errorMessages(error) };
  }
  revalidatePath('/offers');
  if (image !== null && !(await saveImage(id, image))) {
    return imageRejected(values);
  }

  redirect(`/offers/${id}`);
}

/** Removes the image of an offer; already gone is fine. */
export async function deleteOfferImageAction(id: string): Promise<void> {
  try {
    await deleteOfferImage(id);
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
  revalidatePath(`/offers/${id}`);
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

/** `false` when the API refused the image or failed; the error is logged. */
async function saveImage(id: string, image: File): Promise<boolean> {
  try {
    await putOfferImage(id, image);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/** The offer is saved, its image isn't: say so next to the file input. */
async function imageRejected(values: OfferFormValues): Promise<OfferFormState> {
  const t = await getTranslations('offers.errors');
  return {
    values,
    fieldErrors: { image: [t('imageFailed')] },
    formErrors: [],
  };
}

async function errorMessages(error: unknown): Promise<string[]> {
  const t = await getTranslations('offers.errors');
  return saveErrorMessages(error, {
    notFound: t('notFound'),
    failed: t('failed'),
  });
}
