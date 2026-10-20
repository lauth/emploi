'use client';

import { useRef } from 'react';
import { classNames } from '../../utils/class-names';
import { Button } from '../button/button';
import styles from './image-preview.module.css';

export interface ImagePreviewProps {
  src: string;
  /** Describes the image; also names the enlarged view. */
  alt: string;
  /** Accessible name of the thumbnail button, e.g. "Agrandir l’image". */
  openLabel: string;
  /** Text of the button that closes the enlarged view. */
  closeLabel: string;
  className?: string;
}

/**
 * A thumbnail that opens the full image in a modal `<dialog>`: focus moves
 * into it and the page behind is inert; it closes with its button, Escape or
 * (where `closedby` is supported) a click outside, and focus returns to the
 * thumbnail.
 */
export function ImagePreview({
  src,
  alt,
  openLabel,
  closeLabel,
  className,
}: ImagePreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={classNames(styles.thumbnail, className)}
        aria-label={openLabel}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        {/* The button's name says what it does; the image is shown in full when opened. */}
        <img src={src} alt="" className={styles.thumbnailImage} />
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-label={alt}
        closedby="any"
      >
        <img src={src} alt={alt} className={styles.image} />
        <Button
          size="sm"
          className={styles.close}
          onClick={() => dialog.current?.close()}
        >
          {closeLabel}
        </Button>
      </dialog>
    </>
  );
}
