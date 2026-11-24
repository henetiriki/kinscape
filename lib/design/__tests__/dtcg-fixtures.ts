/** Builders for DTCG 2025.10 tokens in a test fixture. */

export const colour = (hex: string) => ({
  $type: 'color',
  $value: { colorSpace: 'srgb', components: [0, 0, 0], hex },
});

export const px = (value: number) => ({
  $type: 'dimension',
  $value: { unit: 'px', value },
});
