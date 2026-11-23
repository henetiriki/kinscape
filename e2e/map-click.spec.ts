import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { TestWindow } from '@ks/e2e/types';

import {
  afterPaint,
  clickPopup,
  coordinates,
  emptyPoint,
  goTo,
} from '@ks/e2e/map-points';

// PIN-01, NFR-05: a click on empty map opens the click popup; "Add a pin here" opens the panel with
// the point. The tests use 1950, as `pins.spec.ts` does.

const addHere = (page: Page) =>
  clickPopup(page).getByRole('button', { exact: true, name: 'Add a pin here' });
const addButton = (page: Page) =>
  page.getByRole('button', { exact: true, name: 'Add a pin' });
/** The text that the popup and the field show for the map point under a page point. */
const textAt = (page: Page, at: { x: number; y: number }) =>
  page.evaluate(({ x, y }) => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { left, top } = map.getContainer().getBoundingClientRect();
    const { lat, lng } = map.unproject([x - left, y - top]);

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, at);

/** The point on the page of the dot minus the point on the page of the map position of `at`. */
const dotOffset = (page: Page, at: { x: number; y: number }) =>
  page.evaluate(
    ({ x, y }) => {
      const { kinscapeMap: map } = window as unknown as TestWindow;
      const { left, top } = map.getContainer().getBoundingClientRect();
      const lngLat = (
        window as unknown as { clicked?: ReturnType<typeof map.unproject> }
      ).clicked;
      const target = lngLat ?? map.unproject([x - left, y - top]);

      (window as unknown as { clicked?: typeof target }).clicked = target;

      const projected = map.project(target);
      const box = document
        .querySelector('[data-testid="click-dot"]')!
        .getBoundingClientRect();

      return {
        x: box.left + box.width / 2 - (left + projected.x),
        y: box.top + box.height / 2 - (top + projected.y),
      };
    },
    { x: at.x, y: at.y }
  );

const start = async (page: Page) => {
  await page.goto('/');
  await goTo(page, '1950');
  await page.waitForFunction(() => 'kinscapeMap' in window);

  // The popup sits left of its point, so a point near the left edge puts it off the page.
  return emptyPoint(page, { x: 0, y: 0 }, 800);
};

test('a click on empty map opens the popup with the point, and a second click moves it', async ({
  page,
}) => {
  const first = await start(page);

  await page.mouse.click(first.x, first.y);
  await expect(clickPopup(page)).toBeVisible();
  await expect(clickPopup(page)).toContainText(await textAt(page, first));

  const second = await emptyPoint(page, first, 120);

  await page.mouse.click(second.x, second.y);
  await expect(clickPopup(page)).toHaveCount(1);
  await expect(clickPopup(page)).toContainText(await textAt(page, second));
});

test('the popup stays at its point after a pan and after a zoom', async ({
  page,
}) => {
  const first = await start(page);

  await page.mouse.click(first.x, first.y);
  await expect(clickPopup(page)).toBeVisible();

  const before = await dotOffset(page, first);

  await page.evaluate(() => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { lat, lng } = map.getCenter();

    map.jumpTo({ center: [lng + 0.2, lat - 0.1] });
  });
  await expect
    .poll(async () => (await dotOffset(page, first)).x)
    .toBeCloseTo(before.x, 0);
  await page.evaluate(() => {
    const { kinscapeMap: map } = window as unknown as TestWindow;

    map.jumpTo({ zoom: map.getZoom() + 0.5 });
  });
  await expect
    .poll(async () => (await dotOffset(page, first)).y)
    .toBeCloseTo(before.y, 0);
});

test('Close and Esc close the popup', async ({ page }) => {
  const first = await start(page);

  await page.mouse.click(first.x, first.y);
  await clickPopup(page).getByRole('button', { name: 'Close' }).click();
  await expect(clickPopup(page)).toBeHidden();
  await page.mouse.click(first.x, first.y);
  await expect(clickPopup(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(clickPopup(page)).toBeHidden();
});

test('"Add a pin here" opens the panel with the point, and a click with the panel open changes the point and opens no popup', async ({
  page,
}) => {
  const first = await start(page);

  await page.mouse.click(first.x, first.y);
  await addHere(page).click();
  await expect(clickPopup(page)).toHaveCount(0);
  await expect(coordinates(page)).toHaveValue(await textAt(page, first));

  const second = await emptyPoint(page, first, 120);

  await page.mouse.click(second.x, second.y);
  await expect(coordinates(page)).toHaveValue(await textAt(page, second));
  await expect(clickPopup(page)).toHaveCount(0);
});

test('"Add a pin" with the popup open closes it and opens the panel empty', async ({
  page,
}) => {
  const first = await start(page);

  await page.mouse.click(first.x, first.y);
  await expect(clickPopup(page)).toBeVisible();
  await addButton(page).click();
  await expect(clickPopup(page)).toHaveCount(0);
  await expect(coordinates(page)).toHaveValue('');
});

// D7 A: the save puts the Pin on the clicked point.
test('a saved Pin sits on the clicked point', async ({ page }) => {
  const family = `Synth${crypto.randomUUID().slice(0, 8)}`;

  await page.goto('/people/new');
  await page.getByLabel('Given names').fill('Ana');
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');

  const first = await start(page);

  await page.mouse.click(first.x, first.y);
  await addHere(page).click();
  await page.getByRole('combobox', { name: 'Person' }).fill(family);
  await page.getByRole('option').filter({ hasText: family }).click();
  await page.getByLabel('Event type').selectOption('residence');
  await page.getByLabel('Date', { exact: true }).fill('FROM 1940 TO 1960');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('form', { name: 'Add a pin' })).toHaveCount(0);

  // No other Pin is within 24 px of the point, so a Pin under it is the new one.
  await expect
    .poll(() =>
      page.evaluate(
        ({ x, y }) => {
          const { kinscapeMap: map } = window as unknown as TestWindow;
          const { left, top } = map.getContainer().getBoundingClientRect();

          return map.queryRenderedFeatures(
            [
              [x - left - 12, y - top - 12],
              [x - left + 12, y - top + 12],
            ],
            { layers: ['pins'] }
          ).length;
        },
        { x: first.x, y: first.y }
      )
    )
    .toBeGreaterThan(0);
});

// NFR-05
test.describe('on a phone', () => {
  test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });

  test('a tap on empty map opens nothing', async ({ page }) => {
    await page.goto('/');
    await goTo(page, '1950');
    await page.waitForFunction(() => 'kinscapeMap' in window);

    const away = await emptyPoint(page, { x: 0, y: 0 });

    await page.touchscreen.tap(away.x, away.y);
    // The check runs after the app has drawn what the tap set off, so it can fail.
    await afterPaint(page);
    await expect(clickPopup(page)).toHaveCount(0);
    await expect(coordinates(page)).toHaveCount(0);
  });
});
