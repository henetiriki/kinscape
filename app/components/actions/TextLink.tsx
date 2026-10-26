import type { ComponentProps } from 'react';

import type { ControlState } from '@/app/components/foundation/types';

import styles from './TextLink.module.css';

/** An anchor has no disabled state, so a disabled link is plain text that says so. */
export const TextLink = ({
  children,
  disabled,
  size,
  state,
  ...rest
}: {
  disabled?: boolean;
  /** `small` is 13 / 20, for dense surfaces such as the Sources dialog. */
  size?: 'small';
  state?: ControlState;
} & Omit<ComponentProps<'a'>, 'className'>) =>
  disabled ? (
    <span aria-disabled='true' className={styles.textLink} data-size={size}>
      {children}
    </span>
  ) : (
    <a
      className={styles.textLink}
      data-size={size}
      data-state={state}
      {...rest}>
      {children}
    </a>
  );
