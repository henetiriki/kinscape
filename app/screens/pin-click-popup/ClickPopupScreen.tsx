'use client';

import { ClickPopup } from '@ks/app/components/overlays/ClickPopup';
import { MapFrame } from '@ks/app/screens/map-frame';
import { AddPinButton } from '@ks/features/map/components/AddPinButton';
import { CLICK_POINT } from '@ks/lib/design/samples.mts';

/* v8 ignore next -- the dev page has no add path until #868; ClickPopup.test.tsx proves the handler */
const noop = () => {};

/** The point of the board `pin-click-popup`, in px, on a desktop. */
const BOARD_POINT = { x: 760, y: 330 };

/**
 * The map screen's frame with the click popup open at the point of the board, and no map: the
 * board `pin-click-popup`. A phone shows no popup. Synthetic data throughout.
 */
export const ClickPopupScreen = () => (
  <MapFrame action={<AddPinButton />}>
    {phone =>
      phone ? undefined : (
        <ClickPopup onAdd={noop} point={CLICK_POINT} {...BOARD_POINT} />
      )
    }
  </MapFrame>
);
