import type { HTMLAttributes } from 'react';
import { classNames } from '../../utils/class-names';
import styles from './alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
}

/**
 * A message about the page or a form. `danger` alerts interrupt screen readers
 * (`role="alert"`); the others are announced politely (`role="status"`).
 */
export function Alert({ tone = 'info', className, ...props }: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={classNames(styles.alert, styles[tone], className)}
      {...props}
    />
  );
}
