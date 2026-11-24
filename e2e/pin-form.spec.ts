import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { slot } from '@ks/e2e/map-points';

// A name no other test uses, so the Person field lists one row for it.
const surname = () => `Synth${crypto.randomUUID().slice(0, 8)}`;

const createPerson = async (page: Page, family: string) => {
  await page.goto('/people/new');
  await page.getByLabel('Given names').fill('Ana');
  await page.getByLabel('Surname').fill(family);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL(url => url.pathname === '/people');
};

/** Types the Map date, as the date field takes it. */
const goTo = async (page: Page, date: string) => {
  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill(date);
  await field.press('Enter');
};

/** The two numbers of "N of M true on this date": the Pins true on the Map date, and all Pins. */
const counts = async (page: Page) => {
  const text = await page
    .getByText(/^\d+ of \d+ true on this date$/)
    .textContent();
  const [shown, all] = text!.match(/\d+/g)!.map(Number);

  return { all, shown };
};

type ListedPin = {
  date1: string;
  date2?: string;
  id: string;
  qualifier: string;
};

/** The Pins that this test saved: the ids that the first load did not list, with its dates. */
const savedPins = async (
  page: Page,
  known: Set<string>,
  dates: { from: number; to: number }
) => {
  // The server can close a connection while it is idle, and the last call comes after a reload.
  // `maxRetries` makes Playwright retry a reset connection (`ECONNRESET`).
  const response = await page.request.get('/data/pins', { maxRetries: 3 });
  const pins = (await response.json()) as ListedPin[];

  return pins.filter(
    pin =>
      !known.has(pin.id) &&
      pin.qualifier === 'FROM' &&
      pin.date1 === String(dates.from) &&
      pin.date2 === String(dates.to)
  ).length;
};

// PIN-01, PIN-02: a new Person shows in the Person field, and a residence FROM 1840 TO 1855 shows at
// 1850, hides at 1860 and stays after a reload. Each slot shifts the dates 30 years earlier, so
// copies of this test side by side do not count each other's Pins.
test('saves a Pin for a new Person that shows inside its dates', async ({
  page,
}) => {
  // Two Person saves, a Pin save and a reload, with 10,000 Pins in software WebGL, take about 21 s.
  test.slow();

  const shift = 30 * slot();
  const dates = { from: 1840 - shift, to: 1855 - shift };
  const inside = String(1850 - shift);
  const outside = String(1860 - shift);
  const family = surname();

  await createPerson(page, family);

  // Until the Pins arrive, the caption reads "0 of 0", so the first count waits for them.
  const pinsLoaded = page.waitForResponse(
    response => new URL(response.url()).pathname === '/data/pins'
  );

  await page.goto('/');

  const listed = (await (await pinsLoaded).json()) as ListedPin[];
  const loaded = listed.length;
  const known = new Set(listed.map(({ id }) => id));

  await page.waitForFunction(() => 'kinscapeMap' in window);
  await expect.poll(async () => (await counts(page)).all).toBe(loaded);
  await goTo(page, inside);

  const before = await counts(page);

  await goTo(page, outside);

  const beforeLater = await counts(page);

  await page.getByRole('button', { name: 'Add a pin' }).click();
  await page.getByRole('combobox', { name: 'Person' }).fill(family);
  await page.getByRole('option').filter({ hasText: family }).click();
  await page.getByLabel('Event type').selectOption('residence');
  await page
    .getByLabel('Date', { exact: true })
    .fill(`FROM ${dates.from} TO ${dates.to}`);
  await page.getByLabel('Coordinates').fill('-33.93, 18.42');

  // The reload after the save waits until the test releases it. The save writes its Pin to the cache
  // first, so the caption counts it before the reload answers. No timer decides this, so a slow
  // runner cannot end the wait early. `page.request` does not use this route.
  let reloadAnswered = false;
  let release!: () => void;
  const held = new Promise<void>(resolve => {
    release = resolve;
  });

  await page.route(
    url => url.pathname === '/data/pins',
    async route => {
      await held;
      reloadAnswered = true;
      await route.continue();
    }
  );
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('form', { name: 'Add a pin' })).toHaveCount(0);

  // The Pins list holds 10,000 Pins at most. The seed leaves room for 50 more Pins. The save tests
  // of other specs add Pins to the same Tree while this test runs, so the total is not exact. The
  // saved Pins of this test are exact, and the Pins of the other specs do not show in its window.
  await expect.poll(async () => savedPins(page, known, dates)).toBe(1);
  await expect
    .poll(async () => (await counts(page)).shown)
    .toBe(beforeLater.shown);
  await goTo(page, inside);
  await expect
    .poll(async () => (await counts(page)).shown)
    .toBe(before.shown + 1);
  expect(reloadAnswered).toBe(false);

  // The route stays on so that the handler's `route.continue()` runs after `release()`. A
  // `page.unroute` here makes it throw "Route is already handled!".
  release();
  await page.reload();
  await goTo(page, inside);
  await expect
    .poll(async () => (await counts(page)).shown)
    .toBe(before.shown + 1);
  expect(await savedPins(page, known, dates)).toBe(1);
});
