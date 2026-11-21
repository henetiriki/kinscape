import type { PinState } from '@ks/app/screens/map-pin-popup/types';

import { MapPinPopupScreen } from '@ks/app/screens/map-pin-popup/MapPinPopupScreen';
import rawTokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';

const { map } = resolveTokens(rawTokens);

/** One state of the Pin popup over the sea colour that stands in for the map. Each page checks the gate. */
export const PinPopupPage = ({ state }: { state: PinState }) => (
  // The sea colour sits on its own layer, as the map canvas does.
  <div style={{ height: '100%', position: 'relative' }}>
    <div
      aria-hidden
      style={{
        background: map.sea,
        inset: 0,
        position: 'absolute',
        willChange: 'transform',
      }}
    />
    <MapPinPopupScreen state={state} />
  </div>
);
