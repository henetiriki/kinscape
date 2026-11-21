'use client';

import type { PinPopupState } from '@ks/app/components/overlays/types';

import { PinPopup, PlacedPinPopup } from '@ks/app/components/overlays/PinPopup';
import { FARM, MapFrame } from '@ks/app/screens/map-frame';
import { PIN_DETAILS, PIN_POPUP } from '@ks/lib/design/samples.mts';

const noop = () => {};

/** What the Pin of the map and the details give the popup. Synthetic. */
const popupProps = (state: PinPopupState) => ({
  ...PIN_POPUP,
  ...(state === 'loaded' ? PIN_DETAILS : {}),
  onClose: noop,
  onRetry: noop,
  state,
});

/**
 * The map screen's frame with the Pin popup open at Example Farm, and no map: the boards
 * `map-pin-popup`, `map-pin-popup-loading`, `map-pin-popup-failed` and `map-pin-popup-phone`.
 * Synthetic data throughout.
 */
export const MapPinPopupScreen = ({ state }: { state: PinPopupState }) => (
  <MapFrame details={<PinPopup {...popupProps(state)} form='inline' />}>
    {phone =>
      phone ? undefined : (
        <PlacedPinPopup {...popupProps(state)} {...FARM.desktop} />
      )
    }
  </MapFrame>
);
