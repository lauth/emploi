import type { HTMLAttributes } from 'react';
import { classNames } from '../../utils/class-names';
import styles from './badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Colour by meaning. The text must carry the meaning too, not only the colour. */
  tone?: BadgeTone;
}

/** A short status label, e.g. the status of an interview step. */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={classNames(styles.badge, styles[tone], className)}
      {...props}
    />
  );
}
