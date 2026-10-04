import { Alert, Button, buttonClassName } from '@emploi/design-system';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { FormState } from '@/lib/forms';
import styles from './offers.module.css';

// Pieces shared by the offer and interview step forms, built on the design
// system (adrs/0017-design-system-package-with-storybook.md).

/** The error of a field, joined for the field's `error` prop. */
export function fieldError<Field extends string>(
  state: FormState<Field>,
  field: Field,
): string | undefined {
  return state.fieldErrors[field]?.join(' ');
}

/** Errors not tied to a field, announced to screen readers. */
export function FormErrors({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <Alert tone="danger">
      <ul>
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </Alert>
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
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? t('saving') : submitLabel}
      </Button>
      <Link href={cancelHref} className={buttonClassName()}>
        {t('cancel')}
      </Link>
    </div>
  );
}
