import type { IconImage } from '@ks/features/map/types';

import { alphaToSdf } from '@ks/lib/domain/map/sdf.mts';

/** A path is drawn in a 24 × 24 box. */
const GLYPH = 24;

/**
 * The margin around the glyph, in CSS pixels. The distance field reaches this far, so a halo of up
 * to this width has room.
 */
const MARGIN = 4;

/**
 * An SDF image of one Event glyph: the path drawn on a canvas, then its alpha turned into a
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
  const field = alphaToSdf(alpha, size, size, MARGIN * ratio);
  const data = new Uint8ClampedArray(size * size * 4);

  // MapLibre reads the distance from the alpha channel of an SDF image.
  field.forEach((distance, index) => {
    data[index * 4 + 3] = distance;
  });

  return { data, height: size, width: size };
};
