import type { ComponentProps } from 'react';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Button } from '@ks/app/components/actions/Button';

/**
 * The map's "Add a pin" button (PIN-01): the primary Button, 44px high. It goes in the `action`
 * slot of `MapLayout`, which hides it on a phone.
 */
export const AddPinButton = ({
  state,
  ...rest
}: {
  state?: ControlState;
} & Omit<
  ComponentProps<'button'>,
  'aria-label' | 'children' | 'className' | 'type'
>) => (
  <Button {...rest} state={state} variant='primary'>
    Add a pin
  </Button>
);
