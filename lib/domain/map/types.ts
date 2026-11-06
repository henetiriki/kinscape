import type { Day } from '@ks/lib/domain/boundaries/types';

/** A one-click way out of a problem: the day to go to, shown at `precision`. */
export type Fix = { day: Day; label: string; precision: Precision };

export type Precision = 'day' | 'month' | 'year';

export type Problem = { fix?: Fix; message: string };
