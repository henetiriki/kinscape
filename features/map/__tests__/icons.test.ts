import { afterEach, describe, expect, it, vi } from 'vitest';

import { iconImage } from '@ks/features/map/icons';

// PIN-03: each Event glyph is an SDF image, so one glyph takes any colour and a halo.
describe('iconImage', () => {
  const path = 'M5 5H19V19H5Z';
  const stub = (ratio: number) => {
    const size = Math.ceil(32 * ratio);
    // The canvas shows a solid block in the middle and nothing at the edges.
    const pixels = new Uint8ClampedArray(size * size * 4);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const solid = Math.abs(x - size / 2) < 6 && Math.abs(y - size / 2) < 6;

        pixels[(y * size + x) * 4 + 3] = solid ? 255 : 0;
      }
    }

    const context = {
      fill: vi.fn(),
      getImageData: vi.fn(() => ({ data: pixels })),
      scale: vi.fn(),
      translate: vi.fn(),
    };
    const canvas = { getContext: vi.fn(() => context), height: 0, width: 0 };

    vi.spyOn(document, 'createElement').mockReturnValue(
      canvas as unknown as HTMLCanvasElement
    );
    const Path2D = vi.fn(class {});

    vi.stubGlobal('Path2D', Path2D);

    return { canvas, context, Path2D, size };
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('draws the path on a canvas of the glyph plus a margin for the halo', () => {
    const { canvas, context, Path2D } = stub(1);
    const image = iconImage(path, 1);

    expect(image.width).toBe(32);
    expect(image.height).toBe(32);
    expect(canvas.width).toBe(32);
    expect(context.scale).toHaveBeenCalledWith(1, 1);
    expect(context.translate).toHaveBeenCalledWith(4, 4);
    expect(Path2D).toHaveBeenCalledExactlyOnceWith(path);
    expect(context.fill).toHaveBeenCalledWith(Path2D.mock.instances[0]);
  });

  it('scales the canvas by the device pixel ratio', () => {
    const { context } = stub(2);
    const image = iconImage(path, 2);

    expect(image.width).toBe(64);
    expect(context.scale).toHaveBeenCalledWith(2, 2);
    expect(image.data).toHaveLength(64 * 64 * 4);
  });

  it('returns a signed distance field in the alpha channel', () => {
    stub(1);

    const { data, width } = iconImage(path, 1);
    const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];

    expect(alphaAt(16, 16)).toBeGreaterThan(191);
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(16, 16 + 5)).toBeGreaterThan(alphaAt(16, 16 + 9));
  });

  // MapLibre sets the halo edge in units of SDF_PX = 8, so 1 px must be 1/8 of the alpha range.
  it('falls one alpha range in 8 CSS pixels, the scale of the MapLibre halo', () => {
    stub(1);

    const { data, width } = iconImage(path, 1);
    const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];

    // The block ends at row 21. The pixel centres of rows 23 and 24 are 1.5 and 2.5 px outside it.
    expect(alphaAt(16, 23)).toBe(143);
    expect(alphaAt(16, 24)).toBe(112);
  });

  it('keeps the 8 px scale on a dense screen', () => {
    stub(2);

    const { data, width } = iconImage(path, 2);
    const alphaAt = (x: number, y: number) => data[(y * width + x) * 4 + 3];

    // At ratio 2 the block ends at row 37. The centres of rows 40 and 42 are 2.5 and 4.5 device px
    // outside it. The field radius is 16 device px.
    expect(alphaAt(32, 40)).toBe(Math.round(255 - 255 * (2.5 / 16 + 0.25)));
    expect(alphaAt(32, 42)).toBe(Math.round(255 - 255 * (4.5 / 16 + 0.25)));
  });
});
