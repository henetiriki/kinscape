import { expect, type Page, test } from '@playwright/test';

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

// MAP-01, MAP-02: the basemap and Polity data all load.
test('the map loads its data files without a failed request', async ({
  page,
}) => {
  const failed: string[] = [];

  page.on('response', response => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(failed).toEqual([]);
});

// MAP-05
test('the map pans and zooms', async ({ page }) => {
  const errors: Error[] = [];

  page.on('pageerror', error => errors.push(error));
  await page.goto('/');

  const canvas = page.locator('canvas.maplibregl-canvas');

  await expect(canvas).toBeVisible();

  const box = (await canvas.boundingBox())!;
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await page.mouse.move(centre.x, centre.y);
  await page.mouse.down();
  await page.mouse.move(centre.x + 120, centre.y + 60, { steps: 5 });
  await page.mouse.up();
  await page.mouse.wheel(0, -300);
  await page.getByRole('button', { name: 'Zoom out' }).click();

  expect(errors).toEqual([]);
  await expect(canvas).toBeVisible();
});

const creditsLine = (page: Page) =>
  page
    .getByRole('paragraph')
    .filter({ has: page.getByRole('button', { name: 'Attributions' }) });

// MAP-02
test('the Polity borders row toggles and drops its credits', async ({
  page,
}) => {
  await page.goto('/');

  const row = page.getByRole('checkbox', { name: 'Polity borders' });
  const credits = creditsLine(page);

  await expect(row).toBeChecked();
  await expect(credits).toContainText('Public Sans');
  await row.click();
  await expect(row).not.toBeChecked();
  await expect(credits).not.toContainText('Public Sans');
  await row.click();
  await expect(row).toBeChecked();
  await expect(credits).toContainText('Public Sans');
});

// NFR-08
test('the credits line opens the sources and attributions dialog', async ({
  page,
}) => {
  await page.goto('/');
  await expect(creditsLine(page)).toContainText('Made with Natural Earth');
  await page.getByRole('button', { name: 'Attributions' }).click();

  const dialog = page.getByRole('dialog', { name: 'Sources and attributions' });

  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('row')).toHaveCount(7);
  await expect(dialog).toContainText('Public domain');
  await expect(dialog).toContainText('SIL Open Font Licence 1.1');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

// BND-01
test('the Polities route serves the 11 Polities and no other country', async ({
  request,
}) => {
  const response = await request.get('/data/polities');
  const { features } = await response.json();
  const names = features
    .filter(
      (f: { properties: { kind: string } }) => f.properties.kind === 'label'
    )
    .map((f: { properties: { name: string } }) => f.properties.name);

  expect(response.ok()).toBe(true);
  expect(features).toHaveLength(22);
  expect(names).toHaveLength(11);
  expect(names).toContain('Lesotho');
  expect(names).toContain('eSwatini');
  expect(names).not.toContain('Mozambique');
});
