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
  <span className={styles.box}>
    <input
      className={styles.checkbox}
      data-state={state}
      type='checkbox'
      {...rest}
    />
    {/* An inline `<svg>`, not a CSS mask: a design snapshot keeps it. */}
    <svg
      aria-hidden='true'
      className={styles.tick}
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='3.2'
      viewBox='0 0 24 24'>
      <path d='M5 12.5l4.5 4.5L19 7.5' />
    </svg>
  </span>
);
