import { describe, expect, it } from 'vitest';

import type { Layer } from '@ks/features/map/types';

import tokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { polityLayer } from '@ks/features/map/layers/polities';
import { buildStyle } from '@ks/features/map/style';

const POLITY_IDS = [
  'polity-borders',
  'polity-borders-low',
  'polity-fills',
  'polity-labels',
];

describe('buildStyle', () => {
  const layers = (day: number, show: boolean) =>
    new Map(
      buildStyle(day, [polityLayer], show).layers.map(layer => [
        layer.id,
        layer,
      ])
    );

  it('builds the same style as before the Layer contract', () => {
    expect(buildStyle(7, [polityLayer])).toMatchSnapshot();
  });

  it('draws the sea, land, coast and rivers from local files', () => {
    const style = buildStyle(0, [polityLayer]);

    expect(style.glyphs).toBe('/glyphs/{fontstack}/{range}.pbf');
    expect((style.sources.land as { data: string }).data).toBe(
      '/map/land.geojson'
    );
    expect((style.sources.polities as { data: string }).data).toBe(
      '/data/polities'
    );
    expect(style.layers.map(layer => layer.id)).toEqual([
      'background',
      'land',
      'polity-fills',
      'rivers',
      'coastline',
      'polity-borders',
      'polity-borders-low',
      'polity-labels',
    ]);
  });

  it('shows or hides all polity layers together', () => {
    for (const [show, expected] of [
      [true, 'visible'],
      [false, 'none'],
    ] as const) {
      const built = layers(7, show);

      for (const id of POLITY_IDS) {
        expect(built.get(id)).toMatchObject({
          filter: polityLayer.filters(7)[id],
          layout: { visibility: expected },
        });
      }
    }
  });

  it('places a layer ahead of its `before` layer or at the end, and strips `before`', () => {
    const extra = (id: string, before?: string): Layer => ({
      filters: () => ({}),
      layers: [{ before, id, source: 'x', type: 'fill' }],
      sources: { x: { data: '/x.geojson', type: 'geojson' } },
    });
    const style = buildStyle(0, [
      extra('first', 'land'),
      extra('last'),
      extra('stale', 'missing'),
    ]);

    expect(style.layers.map(layer => layer.id)).toEqual([
      'background',
      'first',
      'land',
      'rivers',
      'coastline',
      'last',
      'stale',
    ]);
    expect(style.layers.some(layer => 'before' in layer)).toBe(false);
    // A drawing layer without a filter gets no `filter` key, which MapLibre would reject.
    expect(style.layers.some(layer => 'filter' in layer && !layer.filter)).toBe(
      false
    );
  });

  it('labels in Public Sans SemiBold', () => {
    expect(layers(0, true).get('polity-labels')).toMatchObject({
      layout: { 'text-font': ['Public Sans SemiBold'] },
    });
  });

  // DM.2: the land fill and the label halo both follow map.land.
  it('reads the land colour and label halo from map.land', () => {
    const built = layers(0, true);

    expect(built.get('land')).toMatchObject({
      paint: { 'fill-color': tokens.map.land },
    });
    expect(built.get('polity-labels')).toMatchObject({
      paint: { 'text-halo-color': tokens.map.land },
    });
  });

  it('reads the sea, coast, river and border values from the tokens', () => {
    const built = layers(0, true);

    expect(built.get('background')).toMatchObject({
      paint: { 'background-color': tokens.map.sea },
    });
    expect(built.get('coastline')).toMatchObject({
      paint: { 'line-color': tokens.map.coastline.colour },
    });
    expect(built.get('rivers')).toMatchObject({
      paint: { 'line-color': tokens.map.river.colour },
    });
    expect(built.get('polity-borders-low')).toMatchObject({
      paint: {
        'line-color': tokens.map.border.colour,
        'line-dasharray': [4, 2.6],
      },
    });
  });

  it('tints each polity from map.polity, with the default as the fallback', () => {
    const { paint } = layers(0, true).get('polity-fills') as unknown as {
      paint: { 'fill-color': unknown[] };
    };
    const { default: fallback, ...tints } = tokens.map.polity;

    expect(paint['fill-color']).toEqual([
      'match',
      ['get', 'polity'],
      ...Object.entries(tints).flat(),
      fallback,
    ]);
  });
});

describe('map tokens', () => {
  // The selected point and the changed border follow the brand colour.
  it('resolves map.selected to the brand colour', () => {
    const { map } = resolveTokens(tokens);

    expect(map.selected.colour).toBe(tokens.colour.brand);
    expect(map.changed.colour).toBe(tokens.colour.brand);
  });
});
