import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import styles from '@ks/app/components/actions/IconButton.module.css';

/** An action shown only as an icon, such as zoom, close or step, named by its `label`. */
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
