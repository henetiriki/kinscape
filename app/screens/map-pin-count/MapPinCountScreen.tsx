'use client';

import type { ControlState } from '@ks/app/components/foundation/types';

import { Text } from '@ks/app/components/foundation/Text';
import { AtPoint, FARM, MapFrame } from '@ks/app/screens/map-frame';
import { map } from '@ks/design/tokens.generated.ts';
import { CountMarker } from '@ks/features/map/components/CountMarker';

/** The looks of the board's card, by caption. */
const LOOKS: [string, { selected?: boolean; state?: ControlState }][] = [
  ['Default', {}],
  ['Hover', { state: 'hover' }],
  ['Focus', { state: 'focus' }],
  ['Pressed', { state: 'active' }],
  ['Selected', { selected: true }],
];

/**
 * The board `map-pin-count`: the count marker of three Pins at Example Farm, and a card of its
 * looks. Synthetic data throughout.
 */
export const MapPinCountScreen = () => (
  <MapFrame>
    {() => (
      <>
        <AtPoint {...FARM.desktop}>
          <CountMarker count={3} />
        </AtPoint>
        <section
          aria-label='Count marker looks'
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-panel)',
            boxShadow: 'var(--shadow-raised)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-12)',
            left: 400,
            padding: 'var(--space-16)',
            position: 'absolute',
            top: 130,
            width: 400,
          }}>
          <Text variant='overline'>Count marker looks</Text>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {LOOKS.map(([caption, look]) => (
              <span
                key={caption}
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}>
                <span
                  style={{
                    alignItems: 'center',
                    background: map.land,
                    borderRadius: 'var(--radius-control)',
                    display: 'flex',
                    height: 64,
                    justifyContent: 'center',
                    width: 64,
                  }}>
                  <CountMarker count={3} {...look} />
                </span>
                <Text variant='caption'>{caption}</Text>
              </span>
            ))}
          </div>
          <Text variant='small'>Accessible name: “3 Pins”.</Text>
        </section>
      </>
    )}
  </MapFrame>
);
