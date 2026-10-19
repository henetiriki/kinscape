import { area } from '@turf/area';
import { featureCollection, multiPolygon } from '@turf/helpers';
import { intersect } from '@turf/intersect';
import { kinks } from '@turf/kinks';

import { loadBoundaryData } from '../lib/boundaries/load.mts';
import {
  type BoundaryData,
  type BoundaryVersion,
  fromDay,
} from '../lib/boundaries/model.mts';

const DATA_DIR = 'data';

/** Overlaps up to this size per Polity pair are digitising noise, not errors. */
export const OVERLAP_TOLERANCE_M2 = 1_000_000;

type Range = { polity: string; validFrom: number; validTo: null | number };

const describe = (version: BoundaryVersion): string =>
  `${version.file}: ${version.polity} from ${fromDay(version.validFrom)}`;

const endOf = (range: Pick<Range, 'validTo'>): number =>
  range.validTo ?? Infinity;

const hasKinks = (version: BoundaryVersion): boolean => {
  try {
    return (
      kinks(multiPolygon(version.geometry.coordinates)).features.length > 0
    );
  } catch {
    return true;
  }
};

const checkDateOrder = (rows: Range[], kind: string): string[] =>
  rows
    .filter(row => row.validFrom >= endOf(row))
    .map(
      row =>
        `${kind} ${row.polity} from ${fromDay(row.validFrom)}: valid-from must be before valid-to`
    );

/** Each row of a Polity must start where the previous one ended. */
const checkContiguous = (rows: Range[], kind: string): string[] => {
  const byPolity = Map.groupBy(rows, row => row.polity);

  return [...byPolity].flatMap(([polity, group]) => {
    const sorted = group.toSorted((a, b) => a.validFrom - b.validFrom);

    return sorted.slice(1).flatMap((next, index) => {
      const end = endOf(sorted[index]);

      if (next.validFrom < end) {
        return [`${kind} for ${polity} overlap on ${fromDay(next.validFrom)}`];
      }

      return next.validFrom > end
        ? [
            `${kind} for ${polity} have a gap from ${fromDay(end)} to ${fromDay(next.validFrom)}`,
          ]
        : [];
    });
  });
};

const bbox = (version: BoundaryVersion): number[] => {
  const points = version.geometry.coordinates.flat(2);

  return [
    Math.min(...points.map(p => p[0])),
    Math.min(...points.map(p => p[1])),
    Math.max(...points.map(p => p[0])),
    Math.max(...points.map(p => p[1])),
  ];
};

const overlapArea = (a: BoundaryVersion, b: BoundaryVersion): number => {
  const [aw, as, ae, an] = bbox(a);
  const [bw, bs, be, bn] = bbox(b);

  if (aw > be || bw > ae || as > bn || bs > an) {
    return 0;
  }

  const shared = intersect(
    featureCollection([
      multiPolygon(a.geometry.coordinates),
      multiPolygon(b.geometry.coordinates),
    ])
  );

  return shared ? area(shared) : 0;
};

/** Two Polities at the same level may only overlap where both are contested. */
const checkOverlaps = (versions: BoundaryVersion[]): string[] => {
  const found = new Map<string, { area: number; day: number }>();

  versions.forEach((a, index) => {
    for (const b of versions.slice(index + 1)) {
      const day = Math.max(a.validFrom, b.validFrom);

      if (
        a.level !== b.level ||
        a.polity === b.polity ||
        (a.contested && b.contested) ||
        day >= Math.min(endOf(a), endOf(b))
      ) {
        continue;
      }

      const key = [a.polity, b.polity].toSorted().join(' and ');
      const entry = found.get(key) ?? { area: 0, day };

      found.set(key, {
        area: entry.area + overlapArea(a, b),
        day: Math.min(entry.day, day),
      });
    }
  });

  return [...found]
    .filter(([, { area: total }]) => total > OVERLAP_TOLERANCE_M2)
    .map(
      ([key, { day }]) =>
        `${key} overlap on ${fromDay(day)} and are not both contested`
    );
};

const checkReferences = (data: BoundaryData): string[] => {
  const polities = new Set(data.polities.map(row => row.id));
  const sources = new Set(data.sources.map(row => row.id));

  return [
    ...data.boundaries.flatMap(version => [
      ...(polities.has(version.polity)
        ? []
        : [`${describe(version)}: unknown Polity`]),
      ...(sources.has(version.source)
        ? []
        : [`${describe(version)}: unknown source "${version.source}"`]),
    ]),
    ...data.names
      .filter(row => !polities.has(row.polity))
      .map(row => `Name "${row.name}": unknown Polity ${row.polity}`),
  ];
};

export const validateBoundaries = (root: string): string[] => {
  const { data, errors } = loadBoundaryData(root);
  const kinked = data.boundaries.filter(hasKinks);

  return [
    ...errors,
    ...kinked.map(version => `${describe(version)}: invalid geometry`),
    ...checkReferences(data),
    ...checkDateOrder(data.boundaries, 'Boundary version'),
    ...checkDateOrder(data.names, 'Name'),
    ...checkContiguous(data.boundaries, 'Boundary versions'),
    ...checkContiguous(data.names, 'Names'),
    ...checkOverlaps(data.boundaries.filter(v => !kinked.includes(v))),
  ];
};

export const run = (root: string): number => {
  const errors = validateBoundaries(root);

  errors.forEach(error => console.error(error));

  return errors.length === 0 ? 0 : 1;
};

/* v8 ignore next 3 -- only true when run directly with node, not when imported */
if (import.meta.main) {
  process.exitCode = run(DATA_DIR);
}
