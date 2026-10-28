import { describe, expect, it } from 'vitest';

import tokens from '@ks/design/tokens.json';
import { resolveTokens } from '@ks/design/tokens.mts';
import { dateFilter } from '@ks/lib/map/filter';
import { buildStyle, POLITY_LAYERS, polityFilters } from '@ks/lib/map/style';

describe('polityFilters', () => {
  it('applies the Map date to every polity layer', () => {
    const filters = polityFilters(42);

    expect(Object.keys(filters).toSorted()).toEqual(
      [...POLITY_LAYERS].toSorted()
    );
    expect(filters['polity-fills']).toEqual(dateFilter(42, 'boundary'));
    expect(filters['polity-labels']).toEqual(dateFilter(42, 'label'));
  });

  it('splits solid and dashed borders by confidence', () => {
    const filters = polityFilters(1);

    expect(JSON.stringify(filters['polity-borders'])).toContain('"!"');
    expect(JSON.stringify(filters['polity-borders-low'])).not.toContain('"!"');
  });
});

describe('buildStyle', () => {
  const layers = (day: number, show: boolean) =>
    new Map(buildStyle(day, show).layers.map(layer => [layer.id, layer]));

  it('draws the sea, land, coast and rivers from local files', () => {
    const style = buildStyle(0, true);

    expect(style.glyphs).toBe('/glyphs/{fontstack}/{range}.pbf');
    expect(style.sources.land.data).toBe('/map/land.geojson');
    expect(style.sources.polities.data).toBe('/data/polities');
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

      for (const id of POLITY_LAYERS) {
        expect(built.get(id)).toMatchObject({
          filter: polityFilters(7)[id],
          layout: { visibility: expected },
        });
      }
    }
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
