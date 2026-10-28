import type { Layer } from '@ks/features/map/types';

/** A second layer for tests: proves a layer is one file and one line in the list. */
export const testLayer: Layer = {
  description: 'A layer that only the tests draw.',
  filters: () => ({}),
  id: 'test-layer',
  label: 'Test layer',
  layers: [
    { id: 'test-layer-fills', source: 'test-layer', type: 'fill' },
    { id: 'test-layer-lines', source: 'test-layer', type: 'line' },
  ],
  sources: { 'test-layer': { data: '/test.geojson', type: 'geojson' } },
};
