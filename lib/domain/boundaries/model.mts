import type { Day } from '#ks/lib/domain/boundaries/types.ts';

const DAY_MS = 86_400_000;
const EPOCH_MS = Date.UTC(1652, 0, 1);

/** A whole number of days since 1652-01-01 as a Day. */
export const asDay = (days: number): Day => days as Day;

export const toDay = (isoDate: string): Day =>
  asDay(Math.round((Date.parse(`${isoDate}T00:00:00Z`) - EPOCH_MS) / DAY_MS));

export const fromDay = (day: Day): string =>
  new Date(EPOCH_MS + day * DAY_MS).toISOString().slice(0, 10);
