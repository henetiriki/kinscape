/** A one-click way out of a problem: the day to go to, shown at `precision`. */
export type Fix = { day: number; label: string; precision: Precision };

export type Precision = 'day' | 'month' | 'year';

export type Problem = { fix?: Fix; message: string };

/** A run of days with a Boundary version. `validTo` is exclusive; null = still current. */
export type Span = { validFrom: number; validTo: null | number };
