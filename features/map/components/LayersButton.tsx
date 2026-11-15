import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { IconButton } from '@ks/app/components/actions/IconButton';
import { Icon } from '@ks/app/components/foundation/Icon';

/** The phone's one 48px button that opens Layers and filters. */
export const LayersButton = ({
  state,
  ...rest
}: {
  state?: ControlState;
} & Omit<
  ComponentProps<'button'>,
  'aria-label' | 'children' | 'className'
>) => (
  <IconButton
    label='Layers and filters'
    state={state}
    variant='raised'
    {...rest}>
    <Icon name='layers' size={24} />
  </IconButton>
);
