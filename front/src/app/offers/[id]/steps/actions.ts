'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { saveErrorMessages, validationTranslator } from '@/lib/action-helpers';
import {
  ApiError,
  createInterviewStep,
  deleteInterviewStep,
  isNotFound,
  isProblem,
  listInterviewSteps,
  reorderInterviewSteps,
  updateInterviewStep,
} from '@/lib/api';
import {
  parseInterviewStepForm,
  readInterviewStepForm,
  type InterviewStepFormState,
} from '@/lib/interview-step-form';
import { isMoveDirection, moveItem, type MoveDirection } from '@/lib/move-item';

// Server actions are reachable by direct POST requests: every input is
// validated here, and again by the API.

export async function createInterviewStepAction(
  offerId: string,
  _previous: InterviewStepFormState,
  formData: FormData,
): Promise<InterviewStepFormState> {
  const values = readInterviewStepForm(formData);
  const parsed = parseInterviewStepForm(values, await validationTranslator());
  if (!parsed.success) {
    return { values, fieldErrors: parsed.fieldErrors, formErrors: [] };
  }

  try {
    await createInterviewStep(offerId, parsed.data);
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: await errorMessages(error) };
  }

  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}`);
}

export async function updateInterviewStepAction(
  offerId: string,
  stepId: string,
  _previous: InterviewStepFormState,
  formData: FormData,
): Promise<InterviewStepFormState> {
  const values = readInterviewStepForm(formData);
  const parsed = parseInterviewStepForm(values, await validationTranslator());
  if (!parsed.success) {
    return { values, fieldErrors: parsed.fieldErrors, formErrors: [] };
  }

  try {
    await updateInterviewStep(offerId, stepId, parsed.data);
  } catch (error) {
    return { values, fieldErrors: {}, formErrors: await errorMessages(error) };
  }

  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}`);
}

export async function deleteInterviewStepAction(
  offerId: string,
  stepId: string,
): Promise<void> {
  try {
    await deleteInterviewStep(offerId, stepId);
  } catch (error) {
    // Already gone: nothing to delete.
    if (!isNotFound(error)) {
      throw error;
    }
  }
  revalidatePath(`/offers/${offerId}`);
}

/** Moves a step one place up or down, keeping the others in order. */
export async function moveInterviewStepAction(
  offerId: string,
  stepId: string,
  direction: MoveDirection,
): Promise<void> {
  if (!isMoveDirection(direction)) {
    throw new Error('Invalid direction');
  }

  try {
    const steps = await listInterviewSteps(offerId);
    const order = moveItem(
      steps.map((step) => step.id),
      stepId,
      direction,
    );
    if (order !== null) {
      await reorderInterviewSteps(offerId, order);
    }
  } catch (error) {
    // The offer or the steps changed in the meantime (deleted, added in
    // another tab): the refreshed page shows the current order.
    if (!isNotFound(error) && !isOutdatedStepOrder(error)) {
      throw error;
    }
  }
  revalidatePath(`/offers/${offerId}`);
}

/** The API refused a new order that doesn't list the current steps. */
function isOutdatedStepOrder(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    isProblem(error, 'validation-error') &&
    (error.problem?.errors ?? []).some(
      (invalid) =>
        invalid.name === '/stepIds' && invalid.code === 'everyStepOnce',
    )
  );
}

async function errorMessages(error: unknown): Promise<string[]> {
  const t = await getTranslations('steps.errors');
  return saveErrorMessages(error, {
    notFound: t('notFound'),
    failed: t('failed'),
  });
}
