import type { ComponentProps } from 'react';

import type { ControlState } from '@/app/components/foundation/types';

import styles from './Avatar.module.css';

/** The 44 round button that opens the account Menu; `expanded` is its open look. */
export const Avatar = ({
  expanded,
  initial,
  state,
  ...rest
}: {
  expanded?: boolean;
  initial: string;
  state?: ControlState;
} & Omit<
  ComponentProps<'button'>,
  'aria-expanded' | 'aria-haspopup' | 'aria-label' | 'children' | 'className'
>) => (
  <button
    aria-expanded={expanded ?? false}
    aria-haspopup='menu'
    aria-label='Account menu'
    className={styles.avatar}
    data-state={state}
    type='button'
    {...rest}>
    {initial}
  </button>
);
