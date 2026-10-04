import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '../../utils/class-names';
import styles from './button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'md' | 'sm';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * The button classes, for elements that must look like a button but aren't
 * one, such as a router link: `<Link className={buttonClassName()}>`.
 */
export function buttonClassName({
  variant = 'secondary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}): string {
  return classNames(styles.button, styles[variant], styles[size], className);
}

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonStyleOptions, 'className'> {}

/** A button. `type` defaults to `button`, not the browser's `submit`. */
export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}
