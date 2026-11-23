'use client';

import { useEffect } from 'react';

import type { FixedPlace } from '@ks/features/people';

import { useAddPin } from '@ks/app/@map/useAddPin';
import { MapFrame } from '@ks/app/screens/map-frame';

const noop = () => {};

/**
 * The boards of the add-pin form are `map-add-pin` and `pin-form*`. This page shows the real "Add a
 * pin" button and panel in `MapFrame`. `MapFrame` draws the search bar and the dock as the boards do.
 * A `state` in `e2e/design-states.ts` opens and fills the panel. With a `place`, the panel opens at
 * that Place on mount, as "Add a pin here" does. All data is synthetic.
 */
export const PinFormScreen = ({ place }: { place?: FixedPlace }) => {
  const { action, addHere, panel } = useAddPin({ onSaved: noop });

  useEffect(() => {
    if (place) addHere?.(place);
  }, [addHere, place]);

  return <MapFrame action={action} panel={panel} />;
};
