import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

export const Chip = ({
  on,
  state,
  ...rest
}: {
  on: boolean;
  state?: ControlState;
} & Omit<ComponentProps<'button'>, 'aria-pressed' | 'className'>) => (
  <button
    aria-pressed={on}
    className='chip'
    data-state={state}
    type='button'
    {...rest}
  />
);
