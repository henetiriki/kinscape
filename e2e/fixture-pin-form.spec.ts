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

// NFR-05
test('shows no button and no panel on a phone', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/');
  await page.waitForFunction(() => 'kinscapeMap' in window);
  await expect(addButton(page)).toHaveCount(0);
  await expect(panel(page)).toHaveCount(0);
});
