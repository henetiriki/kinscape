import type { Locator } from '@playwright/test';

import { expect, test } from '@playwright/test';

const WIDTHS = [640, 800, 1024, 1279, 1440, 1920];

const box = async (locator: Locator) => (await locator.boundingBox())!;

const apart = (
  a: { height: number; width: number; x: number; y: number },
  b: { height: number; width: number; x: number; y: number }
) =>
  a.x + a.width <= b.x ||
  b.x + b.width <= a.x ||
  a.y + a.height <= b.y ||
  b.y + b.height <= a.y;

for (const width of WIDTHS) {
  test.describe(`desktop, ${width} × 800`, () => {
    test.use({ viewport: { height: 800, width } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('radiogroup').first()).toBeVisible();
    });

    // NFR-05, NFR-08
    test('the credits line clears the dock and keeps the Attributions link', async ({
      page,
    }) => {
      const credits = page
        .getByRole('paragraph')
        .filter({ has: page.getByRole('button', { name: 'Attributions' }) });
      const dock = page.locator('[data-slot="dock"]');

      await expect(
        page.getByRole('button', { name: 'Attributions' })
      ).toBeVisible();
      expect(apart(await box(credits), await box(dock))).toBe(true);
    });

    // NFR-05
    test('the scale bar clears the Layers panel, the dock and the credits', async ({
      page,
    }) => {
      const scale = page.locator('.maplibregl-ctrl-scale');

      await expect(scale).toBeVisible();

      const scaleBox = await box(scale);

      for (const other of [
        page.locator('[data-slot="panel"]'),
        page.locator('[data-slot="dock"]'),
        page
          .getByRole('paragraph')
          .filter({ has: page.getByRole('button', { name: 'Attributions' }) }),
      ]) {
        expect(apart(scaleBox, await box(other))).toBe(true);
      }
    });
  });
}
