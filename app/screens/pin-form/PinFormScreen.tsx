'use client';

import { useEffect } from 'react';

import type { FixedPlace } from '@ks/features/people';
import type { MapPin } from '@ks/lib/domain/pins/types.ts';

import { useAddPin } from '@ks/app/@map/useAddPin';
import { MapFrame } from '@ks/app/screens/map-frame';

/**
 * The boards of the add-pin form are `map-add-pin` and `pin-form*`; the boards of the edit form are
 * `pin-edit*`. This page shows the real "Add a pin" button and panel in `MapFrame`. `MapFrame`
 * draws the search bar and the dock as the boards do. A `state` in `e2e/design-states.ts` opens and
 * fills the panel. With a `place`, the panel opens at that Place on mount, as "Add a pin here"
 * does. With a `pinId`, the edit panel opens on mount, as "Edit" does. All data is synthetic.
 */
export const PinFormScreen = ({
  pinId,
  place,
}: {
  pinId?: MapPin['id'];
  place?: FixedPlace;
}) => {
  const { action, addHere, edit, panel } = useAddPin();

  useEffect(() => {
    if (place) addHere?.(place);
  }, [addHere, place]);

  useEffect(() => {
    if (pinId) edit?.(pinId);
  }, [edit, pinId]);

  return <MapFrame action={action} panel={panel} />;
};
