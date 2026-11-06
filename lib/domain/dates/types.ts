import type { Day } from '@ks/lib/domain/boundaries/types';
import type { Precision } from '@ks/lib/domain/map/types';
import type { Validity } from '@ks/lib/domain/validity/types';

/**
 * A GEDCOM date. `date1` and `date2` are `1850`, `1850-03` or `1850-03-15`.
 * `earliest` and `latest` are ISO days, both inclusive. As a Validity it runs
 * from `earliestDay` to `latestDay + 1`, so `isCurrentOn` applies.
 * `precision` is the coarser of the stored dates.
 */
export type FuzzyDate = {
  date1: string;
  date2?: string;
  earliest: string;
  earliestDay: Day;
  latest: string;
  latestDay: Day;
  precision: Precision;
  qualifier: Qualifier;
} & Validity;

export type FuzzyDateError = 'no-such-day' | 'reversed' | 'syntax' | 'year';

export type Qualifier =
  'ABT' | 'AFT' | 'BEF' | 'BET' | 'CAL' | 'EST' | 'EXACT' | 'FROM';
