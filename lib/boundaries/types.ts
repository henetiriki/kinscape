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
  /** What was done to the data, such as clipping and simplifying. */
  processing?: string;
  title: string;
};

type Confidence = 'high' | 'low';

type Level = 'district' | 'polity';
