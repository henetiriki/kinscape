import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

import styles from './TextLink.module.css';

/** An anchor has no disabled state, so a disabled link is plain text that says so. */
export const TextLink = ({
  children,
  disabled,
  state,
  ...rest
}: {
  disabled?: boolean;
  state?: ControlState;
} & Omit<ComponentProps<'a'>, 'className'>) =>
  disabled ? (
    <span aria-disabled='true' className={styles.textLink}>
      {children}
    </span>
  ) : (
    <a className={styles.textLink} data-state={state} {...rest}>
      {children}
    </a>
  );
