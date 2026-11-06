import type { z } from 'zod';

import type {
  boundaryFeature,
  nameRow,
  polityRow,
  sourceRow,
} from '@ks/lib/domain/boundaries/schemas.mts';

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

/** UTC days since 1652-01-01, made only by `toDay`, `asDay` and `dayOf`. */
export type Day = { brand: 'Day' } & number;

export type Polity = z.output<typeof polityRow>;

export type PolityName = z.output<typeof nameRow>;

/** `processing` is what was done to the data, such as clipping and simplifying. */
export type Source = z.output<typeof sourceRow>;
