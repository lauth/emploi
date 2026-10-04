'use client';

import { Button, type ButtonProps } from '@emploi/design-system';
import { useFormStatus } from 'react-dom';

interface ConfirmButtonProps {
  /** The bound server action to run once confirmed. */
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  pendingLabel: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
}

/** A one-button form that asks for confirmation before submitting. */
export function ConfirmButton({
  action,
  confirmMessage,
  label,
  pendingLabel,
  variant,
  size,
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
        variant={variant}
        size={size}
      />
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  variant,
  size,
}: Pick<ConfirmButtonProps, 'label' | 'pendingLabel' | 'variant' | 'size'>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
