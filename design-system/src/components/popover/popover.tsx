import type { ReactNode } from 'react';
import { classNames } from '../../utils/class-names';
import { Button, type ButtonSize } from '../button/button';
import styles from './popover.module.css';

export interface PopoverProps {
  /** Unique in the page; links the button to its panel. Close buttons inside use it too. */
  id: string;
  /** Content of the button that opens the panel. */
  label: ReactNode;
  /** Accessible name of the button, when `label` alone doesn't say what it opens. */
  triggerLabel?: string;
  /** Highlights the button, e.g. when the filter it opens is in use. */
  active?: boolean;
  size?: ButtonSize;
  /** Content of the panel. */
  children: ReactNode;
  className?: string;
}

/**
 * A button opening a panel next to it, with the native HTML popover API: it
 * works without JavaScript, closes on Escape or a click outside, and the
 * browser exposes the open state to screen readers. Where CSS anchor
 * positioning is supported the panel opens below the button; elsewhere the
 * browser centres it.
 */
export function Popover({
  id,
  label,
  triggerLabel,
  active = false,
  size = 'sm',
  children,
  className,
}: PopoverProps) {
  // Anchor names are CSS dashed idents: keep letters, digits, - and _.
  const anchor = `--popover-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  return (
    <>
      <Button
        size={size}
        variant={active ? 'primary' : 'secondary'}
        popoverTarget={id}
        aria-label={triggerLabel}
        style={{ anchorName: anchor }}
      >
        {label}
      </Button>
      <div
        id={id}
        popover="auto"
        className={classNames(styles.panel, className)}
        style={{ positionAnchor: anchor }}
      >
        {children}
      </div>
    </>
  );
}

/** Props of a button inside the panel that closes it, e.g. "Cancel". */
export function popoverCloseProps(id: string) {
  return { popoverTarget: id, popoverTargetAction: 'hide' } as const;
}
