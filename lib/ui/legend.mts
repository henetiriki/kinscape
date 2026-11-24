import type { LegendRow } from '#ks/lib/ui/types.ts';

/** The rows of the Legend, in the order it draws them. */
export const LEGEND_ROWS = [
  'border',
  'approximate',
  'contested',
  'uncertain',
  'events',
] as const;

/** The rows for the marks the live map draws. BND-04 and EXP-02 add `contested` and `uncertain`. */
export const DRAWN_LEGEND_ROWS: LegendRow[] = [
  'border',
  'approximate',
  'events',
];
