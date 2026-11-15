import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { KitLink } from '@ks/app/components/foundation/link';

import styles from '@ks/app/components/actions/TextLink.module.css';

/** An anchor has no disabled state, so a disabled link is plain text that says so. */
export const TextLink = ({
  children,
  disabled,
  href,
  size,
  state,
  ...rest
}: {
  disabled?: boolean;
  /** Required unless `disabled`. */
  href?: string;
  /** `small` is 13 / 20, for dense surfaces such as the Sources dialog. */
  size?: 'small';
  state?: ControlState;
} & Omit<ComponentProps<'a'>, 'className'>) =>
  disabled ? (
    <span aria-disabled='true' className={styles.textLink} data-size={size}>
      {children}
    </span>
  ) : (
    <KitLink
      className={styles.textLink}
      data-size={size}
      data-state={state}
      href={href!}
      {...rest}>
      {children}
    </KitLink>
  );
