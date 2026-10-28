import type { BoundaryData, BoundaryVersion, Day } from './types.ts';

const DAY_MS = 86_400_000;
const EPOCH_MS = Date.UTC(1652, 0, 1);

export const toDay = (isoDate: string): Day =>
  Math.round((Date.parse(`${isoDate}T00:00:00Z`) - EPOCH_MS) / DAY_MS);

export const fromDay = (day: Day): string =>
  new Date(EPOCH_MS + day * DAY_MS).toISOString().slice(0, 10);

export const isCurrentOn = (
  range: { validFrom: Day; validTo: Day | null },
  day: Day
): boolean =>
  range.validFrom <= day && (range.validTo === null || day < range.validTo);

/** The rows whose range holds `day`. */
export const current = <T extends { validFrom: Day; validTo: Day | null }>(
  rows: readonly T[],
  day: Day
): T[] => rows.filter(row => isCurrentOn(row, day));

export const nameOn = (
  data: BoundaryData,
  polity: string,
  day: Day
): string | undefined =>
  current(data.names, day).find(row => row.polity === polity)?.name;

export const boundaryOn = (
  data: BoundaryData,
  polity: string,
  day: Day
): BoundaryVersion | undefined =>
  current(data.boundaries, day).find(version => version.polity === polity);
