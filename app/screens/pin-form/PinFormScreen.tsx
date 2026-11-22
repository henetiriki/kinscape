'use client';

import { useAddPin } from '@ks/app/@map/useAddPin';
import { MapFrame } from '@ks/app/screens/map-frame';

const noop = () => {};

/**
 * The boards of the add-pin form are `map-add-pin` and `pin-form*`. This page shows the real "Add a
 * pin" button and panel in `MapFrame`. `MapFrame` draws the search bar and the dock as the boards do.
 * A `state` in `e2e/design-states.ts` opens and fills the panel. All data is synthetic.
 */
export const PinFormScreen = () => {
  const { action, panel } = useAddPin({ onSaved: noop });

  return <MapFrame action={action} panel={panel} />;
};
