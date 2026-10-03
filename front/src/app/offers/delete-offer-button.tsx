'use client';

import { useFormStatus } from 'react-dom';
import styles from './offers.module.css';

/** Deletes after a confirmation; `action` is the bound server action. */
export function DeleteOfferButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('Delete this offer? This cannot be undone.')) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.danger} disabled={pending}>
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
