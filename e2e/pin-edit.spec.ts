import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { TestWindow } from '@ks/e2e/types';

import { clickPopup, coordinates, emptyPoint, goTo } from '@ks/e2e/map-points';

// PIN-01, PIN-02: the test saves its own Pin, then edits its date, its Person and its point. The
// Pin is on the empty map at the Map date 1950, as `map-click.spec.ts` does.

type Point = { x: number; y: number };

// A name no other test uses, so the Person field lists one row for it.
const surname = () => `Synth${crypto.randomUUID().slice(0, 8)}`;

const createPerson = async (page: Page, family: string) => {
  await page.goto('/people/new');
  await page.getByLabel('Given names').fill('Ana');
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
};

/** The text that the field shows for the map point under a page point. */
const textAt = (page: Page, at: Point) =>
  page.evaluate(({ x, y }) => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { left, top } = map.getContainer().getBoundingClientRect();
    const { lat, lng } = map.unproject([x - left, y - top]);

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, at);

/** How many Pin symbols the map draws within 12 px of a page point. */
const pinsAt = (page: Page, at: Point) =>
  page.evaluate(({ x, y }) => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { left, top } = map.getContainer().getBoundingClientRect();

    return map.queryRenderedFeatures(
      [
        [x - left - 12, y - top - 12],
        [x - left + 12, y - top + 12],
      ],
      { layers: ['pins'] }
    ).length;
  }, at);

const editForm = (page: Page) => page.getByRole('form', { name: 'Edit a pin' });

/** Clicks the Pin at a page point, and chooses "Edit" in its popup. */
const startEdit = async (page: Page, at: Point) => {
  const popup = page.getByRole('dialog', { name: 'Pin details' });

  // A click right after a Map date change can land before the layer has the Pin as a target.
  await expect(async () => {
    await page.mouse.click(at.x, at.y);
    await expect(popup.getByRole('heading')).toBeVisible({ timeout: 1500 });
  }).toPass();
  await popup.getByRole('button', { name: 'Edit' }).click();
  await expect(popup).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Person' }).waitFor();
};

const saveEdit = async (page: Page) => {
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(editForm(page)).toHaveCount(0);
};

test('edits the date, the Person and the point of a saved Pin', async ({
  page,
}) => {
  const family = surname();
  const other = surname();

  await createPerson(page, family);
  await createPerson(page, other);
  await page.goto('/');
  await goTo(page, '1950');
  await page.waitForFunction(() => 'kinscapeMap' in window);

  const first = await emptyPoint(page, { x: 0, y: 0 }, 800);

  // Save a Pin of the first Person at the first point, from 1940 to 1960.
  await page.mouse.click(first.x, first.y);
  await clickPopup(page)
    .getByRole('button', { exact: true, name: 'Add a pin here' })
    .click();
  await page.getByRole('combobox', { name: 'Person' }).fill(family);
  await page.getByRole('option').filter({ hasText: family }).click();
  await page.getByLabel('Event type').selectOption('residence');
  await page.getByLabel('Date', { exact: true }).fill('FROM 1940 TO 1960');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('form', { name: 'Add a pin' })).toHaveCount(0);
  await expect.poll(() => pinsAt(page, first)).toBeGreaterThan(0);

  // The form shows the values of the Pin, the point with six decimals and the precision fixed.
  await startEdit(page, first);
  await expect(page.getByLabel('Date', { exact: true })).toHaveValue(
    'FROM 1940 TO 1960'
  );
  await expect(coordinates(page)).toHaveValue(/^-?\d+\.\d{6}, -?\d+\.\d{6}$/);
  await expect(
    editForm(page).getByLabel('Precision', { exact: true })
  ).toBeDisabled();

  // A new date: the Pin shows at 1922 and hides at 1950.
  await page.getByLabel('Date', { exact: true }).fill('FROM 1920 TO 1925');
  await saveEdit(page);
  await goTo(page, '1922');
  await expect.poll(() => pinsAt(page, first)).toBeGreaterThan(0);
  await goTo(page, '1950');
  await expect.poll(() => pinsAt(page, first)).toBe(0);

  // A new Person: the popup shows it after a reload.
  await goTo(page, '1922');
  await startEdit(page, first);
  await page.getByRole('combobox', { name: 'Person' }).fill(other);
  await page.getByRole('option').filter({ hasText: other }).click();
  await saveEdit(page);
  await page.reload();
  await goTo(page, '1922');
  await expect.poll(() => pinsAt(page, first)).toBeGreaterThan(0);
  await page.mouse.click(first.x, first.y);
  await expect(
    page.getByRole('dialog', { name: 'Pin details' }).getByRole('heading')
  ).toContainText(other);
  await page.keyboard.press('Escape');

  // New coordinates: the Pin leaves the old point and shows on the new one.
  const second = await emptyPoint(page, first, 120);
  const target = await textAt(page, second);

  await startEdit(page, first);
  await coordinates(page).fill(target);
  await expect(
    editForm(page).getByLabel('Precision', { exact: true })
  ).toBeEnabled();
  await saveEdit(page);
  await expect.poll(() => pinsAt(page, second)).toBeGreaterThan(0);
  await expect.poll(() => pinsAt(page, first)).toBe(0);
});

test('sends no request for the fields of a Pin before "Edit"', async ({
  page,
}) => {
  const asked: string[] = [];

  page.on('request', request => {
    if (new URL(request.url()).pathname.endsWith('/edit')) {
      asked.push(request.url());
    }
  });
  await page.goto('/');
  await goTo(page, '1950');
  await page.waitForFunction(() => 'kinscapeMap' in window);
  await expect(page.getByRole('button', { name: 'Add a pin' })).toBeVisible();
  expect(asked).toEqual([]);
});
