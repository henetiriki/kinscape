import type { ExpressionSpecification } from 'maplibre-gl';

import type { Day } from '@ks/lib/domain/boundaries/types.ts';

/**
 * Keeps the features of one `kind` that are current on `day`. `validTo` is
 * exclusive and null means still current. Every polity layer uses this.
 */
export const dateFilter = (
  day: Day,
  kind: 'boundary' | 'label',
  ...extra: ExpressionSpecification[]
): ExpressionSpecification => [
  'all',
  ['==', ['get', 'kind'], kind],
  ['<=', ['get', 'validFrom'], day],
  ['any', ['==', ['get', 'validTo'], null], ['<', day, ['get', 'validTo']]],
  ...extra,
];
