import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

export const Button = ({
  state,
  variant = 'secondary',
  ...rest
}: {
  state?: ControlState;
  variant?: 'primary' | 'secondary';
} & Omit<ComponentProps<'button'>, 'className'>) => (
  <button
    className={`btn btn-${variant}`}
    data-state={state}
    type='button'
    {...rest}
  />
);
