import type { ComponentProps } from 'react';

import type { ControlState } from '@/app/components/foundation/controls';

import styles from './Checkbox.module.css';

export const Checkbox = ({
  state,
  ...rest
}: {
  state?: ControlState;
} & Omit<ComponentProps<'input'>, 'className' | 'type'>) => (
  <input
    className={styles.checkbox}
    data-state={state}
    type='checkbox'
    {...rest}
  />
);
