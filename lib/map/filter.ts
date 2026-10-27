import type { ExpressionSpecification } from 'maplibre-gl';

import { toDay } from '@ks/lib/boundaries/model.mts';

/** Days since 1652-01-01 for the calendar day of `date`, in UTC. */
export const dayOf = (date: Date): number =>
  toDay(date.toISOString().slice(0, 10));

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
