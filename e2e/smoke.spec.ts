import { expect, test } from '@playwright/test';

test('the page loads and the map canvas renders', async ({ page }) => {
  const errors: Error[] = [];

  page.on('pageerror', error => errors.push(error));
  await page.goto('/');

  const canvas = page.locator('canvas.maplibregl-canvas');

  await expect(canvas).toBeVisible();
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) =>
        Boolean(element.getContext('webgl2') ?? element.getContext('webgl'))
      )
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
