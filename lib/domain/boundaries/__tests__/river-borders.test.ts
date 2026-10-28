import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Feature = {
  geometry: Geometry;
  properties: Record<string, unknown>;
};
type Geometry = { coordinates: unknown; type: string };
type Position = number[];

const read = (path: string): Feature[] =>
  JSON.parse(readFileSync(path, 'utf8')).features;

const EARTH_KM = 6371;
const NEAR_KM = 0.5;

const toKm = ([lon, lat]: Position, originLat: number): Position => [
  ((lon * Math.PI) / 180) * EARTH_KM * Math.cos((originLat * Math.PI) / 180),
  ((lat * Math.PI) / 180) * EARTH_KM,
];

const polygons = (geometry: Geometry): Position[][][] =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates as Position[][]]
    : (geometry.coordinates as Position[][][]);

const rings = (feature: Feature): Position[][] =>
  polygons(feature.geometry).flat();

const vertices = (feature: Feature): Position[] => rings(feature).flat();

const lines = (geometry: Geometry): Position[][] =>
  geometry.type === 'LineString'
    ? [geometry.coordinates as Position[]]
    : (geometry.coordinates as Position[][]);

const key = ([lon, lat]: Position) => `${lon},${lat}`;

const distanceToSegment = (p: Position, a: Position, b: Position): number => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = dx * dx + dy * dy;
  const t =
    length === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)
        );

  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};

const near = (point: Position, river: Position[][], km = NEAR_KM): boolean =>
  river.some(line =>
    line.some(
      (position, index) =>
        index > 0 &&
        distanceToSegment(
          toKm(point, point[1]),
          toKm(line[index - 1], point[1]),
          toKm(position, point[1])
        ) <= km
    )
  );

const river = (...names: string[]): Position[][] =>
  read('public/map/rivers.geojson')
    .filter(({ properties }) => names.includes(String(properties.name)))
    .flatMap(({ geometry }) => lines(geometry));

const provinces = (file: string) =>
  new Map(
    read(`data/boundaries/${file}.geojson`).map(feature => [
      String(feature.properties.polity),
      feature,
    ])
  );

const shared = (a: Feature, b: Feature): Position[] => {
  const other = new Set(vertices(b).map(key));

  return vertices(a).filter(position => other.has(key(position)));
};

const share = (positions: Position[], line: Position[][]): number =>
  positions.filter(position => near(position, line)).length / positions.length;

const area = (feature: Feature): number =>
  polygons(feature.geometry).reduce(
    (sum, [outer, ...holes]) =>
      sum +
      [outer, ...holes].reduce((total, ring, index) => {
        const flat = ring.map(position => toKm(position, -29));
        const twice = flat.reduce(
          (acc, [x, y], i) =>
            acc +
            x * flat[(i + 1) % flat.length][1] -
            flat[(i + 1) % flat.length][0] * y,
          0
        );

        return total + (index === 0 ? 1 : -1) * Math.abs(twice / 2);
      }, 0),
    0
  );

describe('1910 river borders (B289)', () => {
  const union = provinces('1910');
  const old = provinces('1994');
  const freeState = union.get('orange-free-state') as Feature;

  it('follows the Vaal between the Free State and the Transvaal', () => {
    const border = shared(freeState, union.get('transvaal') as Feature);

    expect(border.length).toBeGreaterThan(100);
    expect(share(border, river('Vaal'))).toBeGreaterThanOrEqual(0.8);
  });

  it('follows the Orange between the Free State and the Cape', () => {
    const border = shared(freeState, union.get('cape-of-good-hope') as Feature);

    // North of this the Cape–Free State border near Kimberley is not a river.
    const stretch = border.filter(([, lat]) => lat < -29.7);

    expect(stretch.length).toBeGreaterThan(50);
    expect(share(stretch, river('Orange'))).toBeGreaterThanOrEqual(0.95);
  });

  it('keeps the outer edge on the Limpopo, Orange and Marico as the 1994 file does', () => {
    const edgeRivers = river('Limpopo', 'Marico', 'Orange');
    // Of the vertices within 3 km of those rivers, the share within 0.5 km.
    const edge = (provinceMap: Map<string, Feature>) => {
      const around = [...provinceMap.values()]
        .flatMap(vertices)
        .filter(position => near(position, edgeRivers, 3));

      return share(around, edgeRivers);
    };

    expect(edge(union)).toBeGreaterThanOrEqual(edge(old));
  });

  it('has the same Free State area as the 1994 file within 0.1%', () => {
    const before = area(old.get('free-state') as Feature);

    expect(Math.abs(area(freeState) - before) / before).toBeLessThan(0.001);
  });
});
