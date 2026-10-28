import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { dateFilter } from '@ks/features/map/filter';
import { polityLayer } from '@ks/features/map/layers/polities';

describe('polityLayer', () => {
  it('applies the Map date to every polity layer', () => {
    const filters = polityLayer.filters(42);

    expect(Object.keys(filters).toSorted()).toEqual(
      polityLayer.layers.map(layer => layer.id).toSorted()
    );
    expect(filters['polity-fills']).toEqual(dateFilter(42, 'boundary'));
    expect(filters['polity-labels']).toEqual(dateFilter(42, 'label'));
  });

  it('names its panel row and keeps the ids the row has always had', () => {
    expect(polityLayer.label).toBe('Polity borders');
    expect(polityLayer.description).toBe(
      'Fills, borders and names of the Polities on the Map date.'
    );
    expect(polityLayer.id).toBe('polity-borders');
  });

  it('splits solid and dashed borders by confidence', () => {
    const filters = polityLayer.filters(1);

    expect(JSON.stringify(filters['polity-borders'])).toContain('"!"');
    expect(JSON.stringify(filters['polity-borders-low'])).not.toContain('"!"');
  });
});

// The server page passes each layer, whose `filters` is a function, to the client map.
describe('layer files', () => {
  const files = globSync('features/map/layers/*.ts');

  it.each(files)('%s starts with the use client directive', file => {
    const code = readFileSync(file, 'utf8')
      .split('\n')
      .filter(line => !line.startsWith('//'))
      .join('\n')
      .trimStart();

    expect(code).toMatch(/^'use client';/);
  });
});
