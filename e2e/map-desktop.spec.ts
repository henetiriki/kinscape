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
      const credits = page.locator('[data-slot="credits"]');
      const dock = page.locator('[data-slot="dock"]');

      await expect(
        page.getByRole('button', { name: 'Attributions' })
      ).toBeVisible();
      expect(apart(await box(credits), await box(dock))).toBe(true);
    });

    // NFR-05, NFR-08
    test('the Credits button shows every attribution and moves nothing', async ({
      page,
    }) => {
      const button = page.getByRole('button', { exact: true, name: 'Credits' });
      const card = page.locator('[data-slot="credits"] p');
      const fixed = [
        page.locator('[data-slot="dock"]'),
        page.locator('[data-slot="panel"]'),
      ];
      const before = [await box(fixed[0]), await box(fixed[1])];

      await expect(card).toBeHidden();
      await button.click();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(card).toContainText('Made with Natural Earth');
      await expect(card).toContainText('Public Sans');
      await expect(card).toContainText('MapLibre');
      expect([await box(fixed[0]), await box(fixed[1])]).toEqual(before);

      const cardBox = await box(card);

      expect(cardBox.x).toBeGreaterThanOrEqual(0);
      expect(cardBox.y).toBeGreaterThanOrEqual(0);

      await page.keyboard.press('Escape');
      await expect(card).toBeHidden();
    });

    // NFR-05
    test('the scale bar takes the credits type, colour and place from the design', async ({
      page,
    }) => {
      const scale = page.locator('.maplibregl-ctrl-scale');

      await expect(scale).toHaveCSS('font-size', '11px');
      await expect(scale).toHaveCSS('color', 'rgb(36, 48, 43)');
      await expect(scale).toHaveCSS('border-bottom-width', '1px');
      await expect(scale).toHaveCSS('line-height', '16px');
      await expect(scale).toHaveCSS(
        'background-color',
        'rgba(255, 255, 255, 0.6)'
      );

      const { height, x, y } = await box(scale);

      expect(x).toBeCloseTo(24, 0);
      expect(800 - (y + height)).toBeCloseTo(6, 0);
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
        page.locator('[data-slot="credits"]'),
      ]) {
        expect(apart(scaleBox, await box(other))).toBe(true);
      }
    });
  });
}

// NFR-05, NFR-06: the controls on the map carry hashed class names, not the plain ones.
test.describe('desktop, 1440 × 800', () => {
  test.use({ viewport: { height: 800, width: 1440 } });

  test('the live controls carry hashed class names, not the plain ones', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('radiogroup').first()).toBeVisible();

    for (const [control, plain] of [
      [page.getByRole('button', { name: 'Zoom in' }), 'iconBtn'],
      // The Sources dialog is closed, so its links are in the DOM but hidden.
      [page.locator('table a'), 'textLink'],
      [page.getByRole('checkbox', { name: 'Polity borders' }), 'checkbox'],
      [page.locator('label', { hasText: 'Month' }), 'segItem'],
    ] as const) {
      const tokens = await control
        .first()
        .evaluate(node => Array.from(node.classList));

      expect(tokens.some(token => token.includes(plain))).toBe(true);
      expect(tokens).not.toContain(plain);
    }
  });
});
