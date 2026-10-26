import type { BoundaryData, BoundaryVersion } from './types.ts';

const DAY_MS = 86_400_000;
const EPOCH_MS = Date.UTC(1652, 0, 1);

export const toDay = (isoDate: string): number =>
  Math.round((Date.parse(`${isoDate}T00:00:00Z`) - EPOCH_MS) / DAY_MS);

export const fromDay = (day: number): string =>
  new Date(EPOCH_MS + day * DAY_MS).toISOString().slice(0, 10);

export const isCurrentOn = (
  range: { validFrom: number; validTo: null | number },
  day: number
): boolean =>
  range.validFrom <= day && (range.validTo === null || day < range.validTo);

export const nameOn = (
  data: BoundaryData,
  polity: string,
  day: number
): string | undefined =>
  data.names.find(row => row.polity === polity && isCurrentOn(row, day))?.name;

export const boundaryOn = (
  data: BoundaryData,
  polity: string,
  day: number
): BoundaryVersion | undefined =>
  data.boundaries.find(
    version => version.polity === polity && isCurrentOn(version, day)
  );
