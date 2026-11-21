import type { PinPopupState } from '@ks/app/components/overlays/types';

import { MapPinPopupScreen } from '@ks/app/screens/map-pin-popup/MapPinPopupScreen';

/** One state of the Pin popup. Each page checks the gate. */
export const PinPopupPage = ({ state }: { state: PinPopupState }) => (
  <MapPinPopupScreen state={state} />
);
