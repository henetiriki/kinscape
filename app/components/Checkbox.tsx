import type { ComponentProps } from 'react';

import type { ControlState } from './controls';

export const Checkbox = ({
  state,
  ...rest
}: {
  state?: ControlState;
} & Omit<ComponentProps<'input'>, 'className' | 'type'>) => (
  <input className='checkbox' data-state={state} type='checkbox' {...rest} />
);
