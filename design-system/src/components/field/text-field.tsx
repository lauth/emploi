import type { InputHTMLAttributes } from 'react';
import { FieldShell, type FieldProps } from './field-shell';
import styles from './field.module.css';

export interface TextFieldProps
  extends
    FieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {}

/** A labelled `<input>`: text, url, date, email… */
export function TextField({
  label,
  labelHidden,
  hint,
  error,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
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
        <input className={styles.control} {...inputProps} {...control} />
      )}
    </FieldShell>
  );
}
