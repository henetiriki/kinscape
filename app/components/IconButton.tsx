import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

export const IconButton = ({
  label,
  state,
  ...rest
}: {
  label: string;
  state?: ControlState;
} & Omit<ComponentProps<'button'>, 'aria-label' | 'className'>) => (
  <button
    aria-label={label}
    className='icon-btn'
    data-state={state}
    type='button'
    {...rest}
  />
);
