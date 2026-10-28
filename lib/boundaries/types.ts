import type { z } from 'zod';

import type { nameRow, polityRow, sourceRow } from './schemas.mts';

export type BoundaryData = {
  boundaries: BoundaryVersion[];
  names: PolityName[];
  polities: Polity[];
  sources: Source[];
};

export type BoundaryVersion = {
  confidence: Confidence;
  contested: boolean;
  file: string;
  geometry: { coordinates: number[][][][]; type: 'MultiPolygon' };
  level: Level;
  polity: string;
  source: string;
  validFrom: number;
  validTo: null | number;
};

export type Polity = z.output<typeof polityRow>;

/** Days are UTC days since 1652-01-01. `validTo` is exclusive; null = still current. */
export type PolityName = z.output<typeof nameRow>;

/** `processing` is what was done to the data, such as clipping and simplifying. */
export type Source = z.output<typeof sourceRow>;

type Confidence = 'high' | 'low';

type Level = 'district' | 'polity';
