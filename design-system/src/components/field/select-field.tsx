import type { SelectHTMLAttributes } from 'react';
import { FieldShell, type FieldProps } from './field-shell';
import styles from './field.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends
    FieldProps,
    Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      'id' | 'className' | 'children'
    > {
  options: readonly SelectOption[];
}

/** A labelled `<select>`. */
export function SelectField({
  label,
  hint,
  error,
  id,
  className,
  options,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      id={id}
      className={className}
    >
      {(control) => (
        <select className={styles.control} {...selectProps} {...control}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
