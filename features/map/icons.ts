import type { IconImage } from '@ks/features/map/types';

import { alphaToSdf } from '@ks/lib/domain/map/sdf.mts';

/** A path is drawn in a 24 × 24 box. */
const GLYPH = 24;

/** The margin around the glyph, in CSS pixels. A halo of up to this width has room. */
const MARGIN = 4;

/**
 * The distance, in CSS pixels, over which the field falls through its whole range. MapLibre's SDF
 * shader sets the halo edge in units of `SDF_PX = 8.0`, so `icon-halo-width: 2` draws 2 px only
 * if the field falls one range in 8 px.
 */
const FIELD_RADIUS = 8;

/**
 * An SDF image of one Event glyph: the path drawn on a canvas, then its alpha changed to a
 * distance field. `ratio` is the device pixel ratio, so the image stays sharp on a dense screen.
 */
export const iconImage = (path: string, ratio: number): IconImage => {
  const size = Math.ceil((GLYPH + 2 * MARGIN) * ratio);
  const canvas = document.createElement('canvas');

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d', { willReadFrequently: true })!;

  context.scale(ratio, ratio);
  context.translate(MARGIN, MARGIN);
  context.fill(new Path2D(path));

  const { data: pixels } = context.getImageData(0, 0, size, size);
  const alpha = Uint8ClampedArray.from(
    { length: size * size },
    (_, index) => pixels[index * 4 + 3]
  );
  const field = alphaToSdf(alpha, size, size, FIELD_RADIUS * ratio);
  const data = new Uint8ClampedArray(size * size * 4);

  // MapLibre reads the distance from the alpha channel of an SDF image.
  field.forEach((distance, index) => {
    data[index * 4 + 3] = distance;
  });

  return { data, height: size, width: size };
};
