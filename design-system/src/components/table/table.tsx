import { useId, type ReactNode, type TableHTMLAttributes } from 'react';
import { classNames } from '../../utils/class-names';
import { visuallyHidden } from '../../utils/visually-hidden';
import styles from './table.module.css';

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Says what the table lists; read by screen readers, hidden unless `captionVisible`. */
  caption: ReactNode;
  captionVisible?: boolean;
}

/**
 * A data table, full width, scrolling sideways when it doesn't fit. Give it a
 * `<thead>` and `<tbody>`. A sortable column puts `aria-sort` on its `<th>` and
 * a link or button with `sortableHeaderClassName` inside: the arrows follow
 * `aria-sort`, which screen readers announce.
 */
export function Table({
  caption,
  captionVisible = false,
  className,
  children,
  ...props
}: TableProps) {
  const captionId = useId();
  return (
    <div
      role="region"
      aria-labelledby={captionId}
      className={styles.scroll}
      // A region that can scroll must be reachable with the keyboard (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      <table className={classNames(styles.table, className)} {...props}>
        <caption
          id={captionId}
          className={captionVisible ? styles.caption : visuallyHidden}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

/** Class of the link or button that sorts by a column, inside its `<th aria-sort>`. */
export const sortableHeaderClassName = styles.sortable ?? '';

/** Class of a header cell holding a sort control and other buttons (e.g. a filter). */
export const headerCellClassName = styles.headerCell ?? '';
