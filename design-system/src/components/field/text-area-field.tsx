import type { TextareaHTMLAttributes } from 'react';
import { FieldShell, type FieldProps } from './field-shell';
import styles from './field.module.css';

export interface TextAreaFieldProps
  extends
    FieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> {}

/** A labelled `<textarea>` for long text. */
export function TextAreaField({
  label,
  labelHidden,
  hint,
  error,
  id,
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <FieldShell
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      id={id}
      className={className}
    >
      {(control) => (
        <textarea className={styles.control} {...textareaProps} {...control} />
      )}
    </FieldShell>
  );
}
