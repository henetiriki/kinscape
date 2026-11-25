/** Builders for DTCG 2025.10 tokens in a test fixture. */

export const colour = (hex: string, alpha?: number) => ({
  $type: 'color',
  $value: {
    ...(alpha === undefined ? {} : { alpha }),
    colorSpace: 'srgb',
    components: [0, 0, 0],
    hex,
  },
});

export const px = (value: number) => ({
  $type: 'dimension',
  $value: { unit: 'px', value },
});

export const num = (value: number) => ({ $type: 'number', $value: value });

export const weight = (value: number) => ({
  $type: 'fontWeight',
  $value: value,
});

/** A `transition` of `value` ms with the `ease-out` curve and no delay. */
export const press = (value: number) => ({
  $type: 'transition',
  $value: {
    delay: { unit: 'ms', value: 0 },
    duration: { unit: 'ms', value },
    timingFunction: [0, 0, 0.58, 1],
  },
});

/** A `duration` of `value` ms. */
export const ms = (value: number) => ({
  $type: 'duration',
  $value: { unit: 'ms', value },
});

type Dimension = ReturnType<typeof px>['$value'];

/** One shadow layer, with `rgb(r g b / alpha)` or a hex colour. */
export const layer = (
  y: number,
  blur: number,
  color: ReturnType<typeof colour>['$value'],
  spread = 0
) => ({
  blur: { unit: 'px', value: blur } as Dimension,
  color,
  offsetX: { unit: 'px', value: 0 } as Dimension,
  offsetY: { unit: 'px', value: y } as Dimension,
  spread: { unit: 'px', value: spread } as Dimension,
});

export const shadowOf = (...layers: ReturnType<typeof layer>[]) => ({
  $type: 'shadow',
  $value: layers.length === 1 ? layers[0] : layers,
});
