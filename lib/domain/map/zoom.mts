/** MapLibre's world is 512 px wide at zoom 0 and doubles at each zoom level. */
const WORLD_PX = 512;

const mercatorY = (latitude: number) =>
  Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));

/**
 * The smallest zoom at which a window of `width` × `height` px fits inside `bounds` (west, south,
 * east, north). Below it, the window shows more than the bounds, so MapLibre's `maxBounds` clamp
 * stops zoom out at it.
 */
export const coverZoom = (
  [[west, south], [east, north]]: [[number, number], [number, number]],
  width: number,
  height: number
): number => {
  const widthShare = (east - west) / 360;
  const heightShare = (mercatorY(north) - mercatorY(south)) / (2 * Math.PI);

  return Math.max(
    Math.log2(width / (WORLD_PX * widthShare)),
    Math.log2(height / (WORLD_PX * heightShare))
  );
};
