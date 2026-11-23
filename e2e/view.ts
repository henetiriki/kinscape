import { mercatorY } from '@ks/lib/domain/map/zoom.mts';

/** The middle of `bounds` as longitude and latitude: the middle on screen, so the middle in Mercator. */
export const centreOf = ([[west, south], [east, north]]: [
  [number, number],
  [number, number],
]): [number, number] => {
  const y = (mercatorY(south) + mercatorY(north)) / 2;

  return [
    (west + east) / 2,
    (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * (180 / Math.PI),
  ];
};
