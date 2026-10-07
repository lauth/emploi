import 'server-only';
import { getTranslations } from 'next-intl/server';
import { isProblem } from './api';
import type { TranslateValidation } from './forms';

// Helpers of the server actions behind the forms.

/** Translates validation messages in the locale of the request. */
export async function validationTranslator(): Promise<TranslateValidation> {
  const t = await getTranslations('validation');
  return (message, values) => t(message, values);
}

/**
 * Messages shown above a form when saving fails. The API's problem details
 * are for developers and agents (English, field names): they're logged and the
 * user gets a translated message instead (adrs/0016-internationalized-interface.md,
 * adrs/0024-problem-details-errors.md).
 */
export async function saveErrorMessages(
  error: unknown,
  messages: { notFound: string; failed: string },
): Promise<string[]> {
  if (isProblem(error, 'resource-not-found')) {
    return [messages.notFound];
  }
  console.error(error);
  if (isProblem(error, 'validation-error')) {
    const t = await getTranslations('form');
    return [t('rejected')];
  }
  return [messages.failed];
}
