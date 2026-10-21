import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

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
    <span aria-disabled='true' className='text-link'>
      {children}
    </span>
  ) : (
    <a className='text-link' data-state={state} {...rest}>
      {children}
    </a>
  );
