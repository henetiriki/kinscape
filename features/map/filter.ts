import type { ExpressionSpecification } from 'maplibre-gl';

import type { Day } from '@ks/lib/domain/boundaries/types.ts';

/** The two conditions of a span: it has begun on `day` and has not ended. `validTo` is exclusive. */
const spanConditions = (day: Day): ExpressionSpecification[] => [
  ['<=', ['get', 'validFrom'], day],
  ['any', ['==', ['get', 'validTo'], null], ['<', day, ['get', 'validTo']]],
];

/**
 * Keeps the features whose `validFrom` and `validTo` hold `day`. `validTo` is exclusive and null
 * means still current. The Pins layer uses this.
 */
export const spanFilter = (day: Day): ExpressionSpecification => [
  'all',
  ...spanConditions(day),
];

/**
 * Keeps the features of one `kind` that are current on `day`, as `spanFilter` does. Every polity
 * layer uses this.
 */
export const dateFilter = (
  day: Day,
  kind: 'boundary' | 'label',
  ...extra: ExpressionSpecification[]
): ExpressionSpecification => [
  'all',
  ['==', ['get', 'kind'], kind],
  ...spanConditions(day),
  ...extra,
];
