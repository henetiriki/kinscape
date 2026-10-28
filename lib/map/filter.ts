import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * Keeps the features of one `kind` that are current on `day`. `validTo` is
 * exclusive and null means still current. Every polity layer uses this.
 */
export const dateFilter = (
  day: number,
  kind: 'boundary' | 'label',
  ...extra: ExpressionSpecification[]
): ExpressionSpecification => [
  'all',
  ['==', ['get', 'kind'], kind],
  ['<=', ['get', 'validFrom'], day],
  ['any', ['==', ['get', 'validTo'], null], ['<', day, ['get', 'validTo']]],
  ...extra,
];
