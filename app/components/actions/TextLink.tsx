import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { KitLink } from '@ks/app/components/foundation/link';

import styles from '@ks/app/components/actions/TextLink.module.css';

/**
 * An anchor has no disabled state, so a disabled link is plain text that says so.
 * With `onClick` and no `href` it is a `<button>` with the same look.
 */
export const TextLink = ({
  children,
  disabled,
  href,
  onClick,
  size,
  state,
  ...rest
}: {
  disabled?: boolean;
  /** Required unless `disabled` or `onClick`. */
  href?: string;
  onClick?: () => void;
  /** `small` is 13 / 20, for dense surfaces such as the Sources dialog. */
  size?: 'small';
  state?: ControlState;
} & Omit<ComponentProps<'a'>, 'className' | 'onClick'>) =>
  disabled ? (
    <span aria-disabled='true' className={styles.textLink} data-size={size}>
      {children}
    </span>
  ) : href === undefined && onClick ? (
    <button
      className={styles.textLink}
      data-size={size}
      data-state={state}
      onClick={onClick}
      type='button'>
      {children}
    </button>
  ) : (
    <KitLink
      className={styles.textLink}
      data-size={size}
      data-state={state}
      href={href!}
      onClick={onClick}
      {...rest}>
      {children}
    </KitLink>
  );
