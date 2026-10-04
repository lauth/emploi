import { useId, type ReactNode } from 'react';
import { classNames } from '../../utils/class-names';
import styles from './field.module.css';

/** Props shared by every form field. */
export interface FieldProps {
  /** Visible label, always rendered: placeholders are not labels. */
  label: ReactNode;
  /** Help shown under the label. */
  hint?: ReactNode;
  /** Error shown under the control; marks the control as invalid. */
  error?: ReactNode;
  /** Defaults to a generated id. */
  id?: string;
  className?: string;
}

/** Attributes linking a control to its label, hint and error. */
export interface ControlProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

/**
 * Label, hint and error around a control, with the ids and `aria-*`
 * attributes that link them.
 */
export function FieldShell({
  label,
  hint,
  error,
  id: givenId,
  className,
  children,
}: FieldProps & { children: (control: ControlProps) => ReactNode }) {
  const generatedId = useId();
  const id = givenId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasError = error !== undefined && error !== null && error !== false;
  const describedBy =
    [hint ? hintId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={classNames(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {children({
        id,
        ...(hasError ? { 'aria-invalid': true } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      })}
      {hasError && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
