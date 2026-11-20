/** Stands for "no target found yet"; large, but its square stays finite. */
const FAR = 1e20;

/** The encoding MapLibre reads: the glyph edge sits at `1 - CUTOFF` of the alpha range. */
const CUTOFF = 0.25;

/**
 * One pass of the Felzenszwalb and Huttenlocher squared distance transform over a line of
 * `count` values that start at `values[offset]` and are `step` apart.
 */
const transformLine = (
  values: Float64Array,
  offset: number,
  step: number,
  count: number
) => {
  const source = Float64Array.from(
    { length: count },
    (_, index) => values[offset + index * step]
  );
  // `parabolas` holds the index of each parabola of the lower envelope; `bounds[k]` is where k starts.
  const parabolas = new Int32Array(count);
  const bounds = new Float64Array(count + 1);
  let last = 0;

  bounds[0] = -Infinity;
  bounds[1] = Infinity;

  // Where the parabola of `q` meets the one of `p`.
  const meet = (q: number, p: number) =>
    (source[q] + q * q - (source[p] + p * p)) / (2 * q - 2 * p);

  for (let q = 1; q < count; q += 1) {
    let cross = meet(q, parabolas[last]);

    // The first bound is -Infinity, so the loop stops before `last` goes below 0.
    while (cross <= bounds[last]) {
      last -= 1;
      cross = meet(q, parabolas[last]);
    }

    last += 1;
    parabolas[last] = q;
    bounds[last] = cross;
    bounds[last + 1] = Infinity;
  }

  let k = 0;

  for (let q = 0; q < count; q += 1) {
    while (bounds[k + 1] < q) k += 1;

    const p = parabolas[k];

    values[offset + q * step] = (q - p) * (q - p) + source[p];
  }
};

/**
 * The squared distance from each pixel to the nearest `true` in `targets` (row by row, `width` by
 * `height`). A target pixel gets 0. With no target every value is at least `FAR`.
 */
export const squaredDistances = (
  targets: boolean[],
  width: number,
  height: number
): Float64Array => {
  const grid = Float64Array.from(targets, target => (target ? 0 : FAR));

  for (let x = 0; x < width; x += 1) transformLine(grid, x, width, height);

  for (let y = 0; y < height; y += 1) {
    transformLine(grid, y * width, 1, width);
  }

  return grid;
};

/**
 * Changes the alpha of a glyph to a signed distance field: one byte per pixel, 255 deep inside,
 * 0 further than `radius` outside. The edge is at 191, which is where MapLibre expects it.
 */
export const alphaToSdf = (
  alpha: ArrayLike<number>,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray => {
  const solid = Array.from(
    { length: width * height },
    (_, i) => alpha[i] > 127
  );
  const outside = squaredDistances(solid, width, height);
  const inside = squaredDistances(
    solid.map(is => !is),
    width,
    height
  );

  return Uint8ClampedArray.from(solid, (is, index) => {
    // Half a pixel puts the edge between the last inside and the first outside pixel.
    const distance = is
      ? 0.5 - Math.sqrt(inside[index])
      : Math.sqrt(outside[index]) - 0.5;

    return Math.round(255 - 255 * (distance / radius + CUTOFF));
  });
};
