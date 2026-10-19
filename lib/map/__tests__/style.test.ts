import { describe, expect, it } from 'vitest';

import { dateFilter } from '../filter';
import { buildStyle, POLITY_LAYERS, polityFilters } from '../style';

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
});
