import type { Day } from '@ks/lib/domain/boundaries/types';

/** A ring of a fan of Pins: its radius in px and the number of Pins on it. */
export type FanRing = { count: number; radius: number };

/** Where a Pin of a fan sits: its ring, counted from 0, and its offset in px from the Place, with y down. */
export type FanSpot = { ring: number; x: number; y: number };

/** A one-click way out of a problem: the day to go to, shown at `precision`. */
export type Fix = { day: Day; label: string; precision: Precision };

export type Precision = 'day' | 'month' | 'year';

export type Problem = { fix?: Fix; message: string };
