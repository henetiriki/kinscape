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
} & Omit<ComponentProps<'button'>, 'aria-label' | 'children' | 'className'>;

// With no children the Button is icon-only, so it must be named.
type Content =
  | { children: ReactNode; label?: string }
  | { children?: never; icon: IconName; label: string };

const ICON_SIZE = { l: 20, m: 16, s: 16, xs: 14 } as const;

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
}: Base & Content) => (
  <button
    aria-label={label}
    className={`${styles.btn} ${variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}`}
    data-full={full || undefined}
    data-icon-only={children === undefined || undefined}
    data-round={round || undefined}
    data-size={size === 'm' ? undefined : size}
    data-state={state}
    type='button'
    {...rest}>
    {icon && <Icon name={icon} size={ICON_SIZE[size]} />}
    {children}
  </button>
);
