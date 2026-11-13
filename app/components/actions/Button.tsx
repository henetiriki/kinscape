import type { ComponentProps, ReactNode } from 'react';

import type {
  ControlState,
  IconName,
} from '@ks/app/components/foundation/types';

import { Icon } from '@ks/app/components/foundation/Icon';

import styles from '@ks/app/components/actions/Button.module.css';

type Base = {
  /** Fills the width of its container. */
  full?: boolean;
  /** A leading icon, or the only content of an icon-only Button. */
  icon?: IconName;
  /** Fully round, as Play. */
  round?: boolean;
  /** Heights 50, 44, 40 and 36. */
  size?: 'l' | 'm' | 's' | 'xs';
  state?: ControlState;
  variant?: 'primary' | 'secondary';
};

// With no children the Button is icon-only, so it must be named.
type Content =
  | { children: ReactNode; label?: string }
  | { children?: never; icon: IconName; label: string };

// With an href the props are the anchor props, and `disabled` is a type error.
type ElementProps =
  | ({
      disabled?: never;
      href: string;
    } & Base &
      Omit<ComponentProps<'a'>, 'href' | Omitted>)
  | ({ href?: never } & Base & Omit<ComponentProps<'button'>, Omitted>);

type Omitted = 'aria-label' | 'children' | 'className';

const ICON_SIZE = { l: 20, m: 16, s: 16, xs: 14 } as const;

/**
 * An action: primary for the one main action in a view, secondary for the rest.
 * With an `href` it draws a plain `<a>` with the same look and states.
 */
export const Button = ({
  children,
  full,
  icon,
  label,
  round,
  size = 'm',
  state,
  variant = 'secondary',
  ...rest
}: Content & ElementProps) => {
  const shared = {
    'aria-label': label,
    className: `${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}`,
    'data-full': full || undefined,
    'data-icon-only': children === undefined || undefined,
    'data-round': round || undefined,
    'data-size': size === 'm' ? undefined : size,
    'data-state': state,
  };
  const content = (
    <>
      {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
      {children}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <a {...shared} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button {...shared} type='button' {...rest}>
      {content}
    </button>
  );
};
