import type { z } from 'zod';

import type {
  boundaryFeature,
  nameRow,
  polityRow,
  sourceRow,
} from './schemas.mts';

export type BoundaryData = {
  boundaries: BoundaryVersion[];
  names: PolityName[];
  polities: Polity[];
  sources: Source[];
};

export type BoundaryVersion = { file: string } & Pick<
  z.output<typeof boundaryFeature>,
  'geometry'
> &
  z.output<typeof boundaryFeature>['properties'];

/** Days are UTC days since 1652-01-01. `validTo` is exclusive; null = still current. */
export type Day = number;

export type Polity = z.output<typeof polityRow>;

export type PolityName = z.output<typeof nameRow>;

/** `processing` is what was done to the data, such as clipping and simplifying. */
export type Source = z.output<typeof sourceRow>;
