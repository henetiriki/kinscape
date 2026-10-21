import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

import styles from './Button.module.css';

export const Button = ({
  state,
  variant = 'secondary',
  ...rest
}: {
  state?: ControlState;
  variant?: 'primary' | 'secondary';
} & Omit<ComponentProps<'button'>, 'className'>) => (
  <button
    className={`${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}`}
    data-state={state}
    type='button'
    {...rest}
  />
);
