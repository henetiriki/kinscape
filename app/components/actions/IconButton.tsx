import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

import styles from './IconButton.module.css';

export const IconButton = ({
  label,
  state,
  ...rest
}: {
  label: string;
  state?: ControlState;
} & Omit<ComponentProps<'button'>, 'aria-label' | 'className'>) => (
  <button
    aria-label={label}
    className={styles.iconBtn}
    data-state={state}
    type='button'
    {...rest}
  />
);
