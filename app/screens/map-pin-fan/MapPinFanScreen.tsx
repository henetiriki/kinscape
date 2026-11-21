'use client';

import { AtPoint, FARM, MapFrame } from '@ks/app/screens/map-frame';
import { CountMarker } from '@ks/features/map/components/CountMarker';
import { PinFan } from '@ks/features/map/components/PinFan';
import { FAN_PINS } from '@ks/lib/design/samples.mts';

/**
 * The boards `map-pin-fan` and `map-pin-fan-phone`: the three Pins of Example Farm fanned out. On a
 * desktop the pointer is on Birth. Synthetic data throughout.
 */
export const MapPinFanScreen = () => (
  <MapFrame>
    {phone => (
      <AtPoint {...(phone ? FARM.phone : FARM.desktop)}>
        <PinFan looks={phone ? undefined : { birth: 'hover' }} pins={FAN_PINS}>
          <CountMarker count={3} />
        </PinFan>
      </AtPoint>
    )}
  </MapFrame>
);
