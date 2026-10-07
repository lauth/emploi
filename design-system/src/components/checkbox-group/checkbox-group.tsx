import { useId, type ReactNode } from 'react';
import { classNames } from '../../utils/class-names';
import type { SelectOption } from '../field/select-field';
import styles from './checkbox-group.module.css';

export interface CheckboxGroupProps {
  /** Visible title of the group (`<legend>`), naming it for screen readers. */
  legend: ReactNode;
  /** Name of every checkbox: a form sends one `name=value` per checked box. */
  name: string;
  options: readonly SelectOption[];
  /** Values checked at first. */
  defaultValue?: readonly string[];
  hint?: ReactNode;
  className?: string;
}

/**
 * Several choices among a list, as checkboxes in a `<fieldset>`. Uncontrolled:
 * the form sends the checked values, so it works without JavaScript.
 */
export function CheckboxGroup({
  legend,
  name,
  options,
  defaultValue = [],
  hint,
  className,
}: CheckboxGroupProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <fieldset
      className={classNames(styles.group, className)}
      aria-describedby={hint ? hintId : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={defaultValue.includes(option.value)}
            className={styles.checkbox}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
