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

export type Confidence = 'high' | 'low';

export type Level = 'district' | 'polity';

export type Polity = { id: string };

/** Days are UTC days since 1652-01-01. `validTo` is exclusive; null = still current. */
export type PolityName = {
  name: string;
  polity: string;
  validFrom: number;
  validTo: null | number;
};

export type Source = {
  attribution: string;
  author: string;
  dateChecked: string;
  id: string;
  layer: string;
  licence: string;
  licenceLink: string;
  title: string;
};

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
