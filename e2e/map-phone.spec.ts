import { expect, type Page, test } from '@playwright/test';

// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts).
type TestWindow = {
  kinscapeMap: {
    getCenter: () => { lat: number; lng: number };
    project: (point: { lat: number; lng: number }) => { x: number; y: number };
    queryRenderedFeatures: (
      geometry: undefined,
      options: { layers: string[] }
    ) => { properties: { polity: string } }[];
  };
};

const drawnPolities = async (page: Page) => {
  await page.waitForFunction(() => 'kinscapeMap' in window);

  return page.evaluate(() => {
    const { kinscapeMap } = window as unknown as TestWindow;

    return new Set(
      kinscapeMap
        .queryRenderedFeatures(undefined, { layers: ['polity-fills'] })
        .map(feature => feature.properties.polity)
    ).size;
  });
};

const field = (page: Page) => page.getByRole('textbox', { name: 'Date shown' });
const sheet = (page: Page) => page.getByRole('region', { name: 'Map date' });

const box = async (locator: ReturnType<Page['locator']>) =>
  (await locator.boundingBox())!;

const typeDate = async (page: Page, text: string) => {
  await field(page).fill(text);
  await field(page).press('Enter');
};

test.describe('phone, 390 × 844', () => {
  test.use({ viewport: { height: 844, width: 390 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => drawnPolities(page)).toBe(11);
  });

  // NFR-05
  test('the sheet is 152 tall, with the credits above it and no sideways scroll', async ({
    page,
  }) => {
    const sheetBox = await box(sheet(page));
    const credits = await box(
      page
        .getByRole('paragraph')
        .filter({ has: page.getByRole('button', { name: 'Attributions' }) })
    );

    expect(sheetBox.height).toBe(152);
    expect(sheetBox.y + sheetBox.height).toBe(844);
    expect(credits.y + credits.height).toBeLessThanOrEqual(sheetBox.y);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  // NFR-06
  test('controls are at least 44 and the Layers button 48, with no precision', async ({
    page,
  }) => {
    for (const name of ['Back', 'Forward', 'Close']) {
      const control = page.getByRole('button', { name });

      if (await control.count()) {
        const { height, width } = await box(control.first());

        expect(Math.min(height, width)).toBeGreaterThanOrEqual(44);
      }
    }

    const layers = await box(
      page.getByRole('button', { name: 'Layers and filters' })
    );

    expect([layers.width, layers.height]).toEqual([48, 48]);
    expect(layers.x + layers.width).toBeLessThanOrEqual(390 - 16 + 1);
    expect(layers.x).toBeGreaterThan(195);
    await expect(page.getByRole('radiogroup')).toHaveCount(0);
    await expect(page.locator('.maplibregl-ctrl-zoom-in')).toBeHidden();
  });

  // MAP-03
  test('expanding shows the slider, which moves the date and the map', async ({
    page,
  }) => {
    await expect(page.getByRole('slider')).toHaveCount(0);
    await page.getByRole('button', { name: 'Expand the sheet' }).click();
    await page.getByRole('slider', { name: 'Map date' }).fill('148');
    await expect(field(page)).toHaveValue('1800');
    await expect.poll(() => drawnPolities(page)).toBe(0);
    await page.getByRole('button', { name: 'Forward' }).click();
    await expect(field(page)).toHaveValue('1801');
  });

  // NFR-05
  test('the map centre stays in the area the sheet leaves free', async ({
    page,
  }) => {
    const sheetTop = (await box(sheet(page))).y;
    const centre = await page.evaluate(() => {
      const { kinscapeMap } = window as unknown as TestWindow;

      return kinscapeMap.project(kinscapeMap.getCenter());
    });

    expect(centre.y).toBeLessThan(sheetTop);
  });

  // MAP-02
  test('Layers opens a sheet, turns the Polities off and closes', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Layers and filters' }).click();

    const dialog = page.getByRole('dialog', { name: 'Layers' });

    await expect(dialog).toBeVisible();
    await dialog.getByRole('checkbox', { name: 'Polity borders' }).click();
    await expect.poll(() => drawnPolities(page)).toBe(0);
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  // MAP-03
  test('a typed month reads as its year and steps by a year', async ({
    page,
  }) => {
    await typeDate(page, '1901-06');
    await expect(field(page)).toHaveValue('1901');
    await page.getByRole('button', { name: 'Forward' }).click();
    await expect(field(page)).toHaveValue('1902');
  });

  // MAP-03
  test('an impossible date shows its message above the sheet, with the fix', async ({
    page,
  }) => {
    await typeDate(page, '1901-02-30');

    const callout = page.getByRole('alert').filter({ hasText: 'has 28 days' });

    await expect(callout).toBeVisible();

    const calloutBox = await box(callout);
    const sheetBox = await box(sheet(page));

    expect(calloutBox.x).toBeGreaterThanOrEqual(0);
    expect(calloutBox.x + calloutBox.width).toBeLessThanOrEqual(390);
    expect(calloutBox.y + calloutBox.height).toBeCloseTo(sheetBox.y - 12, 0);
    await page.getByRole('button', { name: 'Go to 1901-02-28' }).click();
    await expect(field(page)).toHaveValue('1901');
  });

  // NFR-06
  test('the keyboard reaches Layers, the grabber, the steps and the field', async ({
    page,
  }) => {
    for (const name of [
      'Layers and filters',
      'Attributions',
      'Expand the sheet',
      'Back',
    ]) {
      const control = page.getByRole('button', { name });

      await control.focus();
      await expect(control).toBeFocused();
      expect(
        await control.evaluate(
          element => getComputedStyle(element).outlineStyle
        )
      ).not.toBe('none');
    }
  });
});

test.describe('short phone, 390 × 400', () => {
  test.use({ viewport: { height: 400, width: 390 } });

  // NFR-05
  test('uses the phone form', async ({ page }) => {
    await page.goto('/');
    await expect(sheet(page)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Layers and filters' })
    ).toBeVisible();
  });
});

test.describe('desktop, 1280 × 800', () => {
  test.use({ viewport: { height: 800, width: 1280 } });

  // NFR-05
  test('keeps the dock, the Layers panel and the credits', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('radiogroup').first()).toBeVisible();
    await expect(
      page.getByRole('complementary', { name: 'Layers' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Layers and filters' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Attributions' })
    ).toBeVisible();
    await expect(page.locator('.maplibregl-ctrl-zoom-in')).toBeVisible();
  });
});
