'use client';

import { useFormStatus } from 'react-dom';

interface ConfirmButtonProps {
  /** The bound server action to run once confirmed. */
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
  className?: string;
}

/** A one-button form that asks for confirmation before submitting. */
export function ConfirmButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
  className,
}: ConfirmButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <SubmitButton
        label={label}
        pendingLabel={pendingLabel}
        className={className}
      />
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  className,
}: Pick<ConfirmButtonProps, 'label' | 'pendingLabel' | 'className'>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
