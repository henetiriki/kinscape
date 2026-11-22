import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { fixtureStateFor } from '@ks/lib/design/check.mts';
import { FIXTURES } from '@ks/server/auth/fixtures.mts';

const family = FIXTURES.find(({ email }) => email === 'r.family@example.com')!;

test.use({ storageState: fixtureStateFor(family.email) });

const addButton = (page: Page) =>
  page.getByRole('button', { name: 'Add a pin' });

const panel = (page: Page) => page.getByRole('form', { name: 'Add a pin' });

// PIN-01
test('opens the panel from the button, and Cancel and Esc close it', async ({
  page,
}) => {
  await page.goto('/');
  await addButton(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(addButton(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(panel(page)).toHaveCount(0);

  await addButton(page).click();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(addButton(page)).toBeVisible();
});

// NFR-03: the Persons load when the panel opens, not before.
test('asks for /data/people only after "Add a pin"', async ({ page }) => {
  const asked: string[] = [];

  page.on('request', request => {
    if (new URL(request.url()).pathname === '/data/people') {
      asked.push(request.url());
    }
  });
  await page.goto('/');
  await expect(addButton(page)).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(asked).toHaveLength(0);
  await addButton(page).click();
  await expect(page.getByRole('combobox', { name: 'Person' })).toBeVisible();
  expect(asked.length).toBeGreaterThan(0);
});

// PIN-01: each field shows its error, and nothing is saved.
test('shows the field errors and saves nothing when the fields are empty', async ({
  page,
}) => {
  await page.goto('/');
  await addButton(page).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Choose a person.')).toBeVisible();
  await expect(page.getByText('Choose an event type.')).toBeVisible();
  await expect(page.getByText('Enter a date.')).toBeVisible();
  await expect(page.getByText('Enter the coordinates.')).toBeVisible();
  await expect(panel(page)).toBeVisible();
});

// PIN-01: the list of the Person field paints above the date dock.
test('draws the Person list above the date dock', async ({ page }) => {
  await page.setViewportSize({ height: 560, width: 1280 });
  await page.goto('/');
  await addButton(page).click();
  await page.getByRole('combobox', { name: 'Person' }).fill('a');

  const list = page.getByRole('listbox', { name: 'People' });

  await expect(list).toBeVisible();

  const box = (await list.boundingBox())!;
  const dock = (await page
    .getByRole('region', { name: 'Map date' })
    .boundingBox())!;
  const left = Math.max(box.x, dock.x);
  const right = Math.min(box.x + box.width, dock.x + dock.width);
  const top = Math.max(box.y, dock.y);
  const bottom = Math.min(box.y + box.height, dock.y + dock.height);

  // The list crosses the dock, so the point below lies in both.
  expect(right).toBeGreaterThan(left);
  expect(bottom).toBeGreaterThan(top);

  const topmost = await page.evaluate(
    ({ x, y }) =>
      document.elementFromPoint(x, y)?.closest('[role="listbox"]') != null,
    { x: (left + right) / 2, y: (top + bottom) / 2 }
  );

  expect(topmost).toBe(true);
});

// PIN-01: an Esc that closes the Person list leaves the panel open, and the next Esc closes it.
test('closes only the Person list on the first Esc', async ({ page }) => {
  await page.goto('/');
  await addButton(page).click();
  await page.getByRole('combobox', { name: 'Person' }).fill('Maria');

  const list = page.getByRole('listbox', { name: 'People' });

  await expect(list).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(list).toHaveCount(0);
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
});

// PIN-01: the date field of the dock owns its Esc, which undoes an edit.
test('keeps the panel open on an Esc in the date field of the dock', async ({
  page,
}) => {
  await page.goto('/');
  await addButton(page).click();
  await expect(panel(page)).toBeVisible();
  await page.getByRole('textbox', { name: 'Date shown' }).fill('1900');
  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeVisible();
});

// PIN-01: a scroll of the panel body closes the Person list.
test('closes the Person list when the panel body scrolls', async ({ page }) => {
  await page.setViewportSize({ height: 500, width: 1280 });
  await page.goto('/');
  await addButton(page).click();
  await page.getByRole('combobox', { name: 'Person' }).fill('a');
  await expect(page.getByRole('listbox', { name: 'People' })).toBeVisible();
  await panel(page)
    .locator('> div')
    .nth(1)
    .evaluate(body => {
      body.scrollTop = 40;
    });
  await expect(page.getByRole('listbox', { name: 'People' })).toHaveCount(0);
});

// NFR-05
test('shows no button and no panel on a phone', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/');
  await page.waitForFunction(() => 'kinscapeMap' in window);
  await expect(addButton(page)).toHaveCount(0);
  await expect(panel(page)).toHaveCount(0);
});
