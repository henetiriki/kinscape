'use client';

import { useAddPin } from '@ks/app/@map/useAddPin';
import { MapFrame } from '@ks/app/screens/map-frame';

const noop = () => {};

/**
 * The boards of the add-pin form (`map-add-pin` and `pin-form*`): the real "Add a pin" button and
 * panel in `MapFrame`, which draws the search bar and the dock as the boards do. A `state` in
 * `e2e/design-states.ts` opens and fills the panel. Synthetic data throughout.
 */
export const PinFormScreen = () => {
  const { action, panel } = useAddPin({ onSaved: noop });

  return <MapFrame action={action} panel={panel} />;
};
