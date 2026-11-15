import { expect, it } from 'vitest';

import MapDefault from '@ks/app/@map/default';

// PPL-01
it('renders no map', () => {
  expect(MapDefault()).toBeNull();
});
