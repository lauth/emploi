import type { HTMLAttributes } from 'react';
import { classNames } from '../../utils/class-names';
import styles from './card.module.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** The element to render: `li` inside a list, `article` or `section` for content. */
  as?: 'div' | 'li' | 'article' | 'section';
}

/** A bordered surface grouping related content. */
export function Card({ as: Element = 'div', className, ...props }: CardProps) {
  return <Element className={classNames(styles.card, className)} {...props} />;
}
