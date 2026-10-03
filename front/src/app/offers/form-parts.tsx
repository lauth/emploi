import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { FormState } from '@/lib/forms';
import styles from './offers.module.css';

// Pieces shared by the offer and interview step forms.

/** `aria-*` attributes linking an invalid input to its error message. */
export function errorProps<Field extends string>(
  state: FormState<Field>,
  field: Field,
) {
  return state.fieldErrors[field]
    ? { 'aria-invalid': true, 'aria-describedby': `${field}-error` }
    : {};
}

/** Errors not tied to a field, announced to screen readers. */
export function FormErrors({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <div role="alert" className={styles.formErrors}>
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export function FieldError({
  field,
  messages,
}: {
  field: string;
  messages: string[] | undefined;
}) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <p id={`${field}-error`} className={styles.fieldError}>
      {messages.join(' ')}
    </p>
  );
}

export function FormActions({
  pending,
  submitLabel,
  cancelHref,
}: {
  pending: boolean;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = useTranslations('form');
  return (
    <div className={styles.actions}>
      <button type="submit" className={styles.primary} disabled={pending}>
        {pending ? t('saving') : submitLabel}
      </button>
      <Link href={cancelHref} className={styles.secondary}>
        {t('cancel')}
      </Link>
    </div>
  );
}
