import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import styles from '@ks/app/components/forms/Checkbox.module.css';

/** A checkbox with no label of its own: name it with `aria-label`, or use `CheckboxField`. */
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
