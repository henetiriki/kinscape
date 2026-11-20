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
});
