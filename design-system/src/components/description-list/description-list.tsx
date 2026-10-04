import type { ReactNode } from 'react';
import { classNames } from '../../utils/class-names';
import styles from './description-list.module.css';

export interface DescriptionListItem {
  /** Unique within the list. */
  key: string;
  term: ReactNode;
  description: ReactNode;
}

export interface DescriptionListProps {
  items: readonly DescriptionListItem[];
  className?: string;
}

/** Terms and their values in two columns, e.g. the details of an offer. */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={classNames(styles.list, className)}>
      {items.map((item) => (
        <div key={item.key} className={styles.item}>
          <dt className={styles.term}>{item.term}</dt>
          <dd className={styles.description}>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
