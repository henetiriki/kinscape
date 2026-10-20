import polylabel from 'polylabel';

import type { BoundaryData, BoundaryVersion } from '../boundaries/model.mts';

export type PolityCollection = {
  features: PolityFeature[];
  type: 'FeatureCollection';
};

export type PolityFeature = {
  geometry:
    { coordinates: number[]; type: 'Point' } | BoundaryVersion['geometry'];
  properties: Record<string, boolean | null | number | string>;
  type: 'Feature';
};

/** A fraction of a degree, about 1 km. */
const LABEL_PRECISION = 0.01;

const ringArea = (ring: number[][]): number =>
  Math.abs(
    ring.reduce(
      (sum, [x, y], index) =>
        sum +
        x * ring[(index + 1) % ring.length][1] -
        ring[(index + 1) % ring.length][0] * y,
      0
    ) / 2
  );

/** The point furthest inside the largest polygon, so a label never sits on an edge. */
const labelPoint = (version: BoundaryVersion): number[] => {
  const largest = version.geometry.coordinates.reduce((best, polygon) =>
    ringArea(polygon[0]) > ringArea(best[0]) ? polygon : best
  );

  return polylabel(largest, LABEL_PRECISION).slice(0, 2);
};

/**
 * Every Boundary version as one feature, and one label point per name row,
 * each with `validFrom` and `validTo` so the Map date filter applies.
 */
export const polityCollection = (data: BoundaryData): PolityCollection => ({
  features: [
    ...data.boundaries.map((version): PolityFeature => ({
      geometry: version.geometry,
      properties: {
        confidence: version.confidence,
        contested: version.contested,
        kind: 'boundary',
        polity: version.polity,
        validFrom: version.validFrom,
        validTo: version.validTo,
      },
      type: 'Feature',
    })),
    ...data.names.flatMap((row): PolityFeature[] => {
      // The version the name starts under; M1.4 refines this when shapes change.
      const version = data.boundaries.find(
        candidate =>
          candidate.polity === row.polity &&
          candidate.validFrom < (row.validTo ?? Infinity) &&
          row.validFrom < (candidate.validTo ?? Infinity)
      );

      return version
        ? [
            {
              geometry: { coordinates: labelPoint(version), type: 'Point' },
              properties: {
                kind: 'label',
                name: row.name,
                polity: row.polity,
                validFrom: row.validFrom,
                validTo: row.validTo,
              },
              type: 'Feature',
            },
          ]
        : [];
    }),
  ],
  type: 'FeatureCollection',
});
