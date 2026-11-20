import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import { EVENT_TYPES } from '@ks/lib/domain/pins/schemas.mts';

// The seed (scripts/seed-ci.mts) adds 10,000 Pins to the SYNTHETIC Tree of the Postgres that the
// CI `e2e` job uses. The memory adapters hold none, so these tests skip there.
// eslint-disable-next-line no-restricted-syntax -- the Pins exist only on the seeded Postgres of the CI e2e job (plan M2.13.2)
test.skip(
  process.env.KINSCAPE_MEMORY_SIGN_IN !== '1',
  'The Pins come from scripts/seed-ci.mts'
);

const SEEDED = 10_000;

// The map is on window only in builds made with NEXT_PUBLIC_E2E=1 (playwright.config.ts).
type TestWindow = {
  kinscapeMap: {
    hasImage: (id: string) => boolean;
    queryRenderedFeatures: (
      geometry: undefined,
      options: { layers: string[] }
    ) => { properties: { eventType: string } }[];
  };
};

const shownTypes = async (page: Page) => {
  await page.waitForFunction(() => 'kinscapeMap' in window);

  return page.evaluate(() => {
    const { kinscapeMap } = window as unknown as TestWindow;

    return kinscapeMap
      .queryRenderedFeatures(undefined, { layers: ['pins'] })
      .map(feature => feature.properties.eventType);
  });
};

const hasImage = (page: Page, eventType: string) =>
  page.evaluate(
    id => (window as unknown as TestWindow).kinscapeMap.hasImage(id),
    `pin-${eventType}`
  );

/** Types the Map date, as the date field takes it. */
const goTo = async (page: Page, date: string) => {
  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill(date);
  await field.press('Enter');
};

const caption = (page: Page) =>
  page.getByText(/^\d+ of \d+ true on this date$/);

// PIN-03: pin 0 of the seed is a residence from 1840 to 1855.
test('draws the Pins of the Map date, each with the glyph of its event type', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1850');
  await expect
    .poll(async () => (await shownTypes(page)).length)
    .toBeGreaterThan(0);

  const types = new Set(await shownTypes(page));

  expect(types.size).toBeGreaterThan(4);

  for (const type of types) {
    expect(EVENT_TYPES).toContain(type);
    await expect.poll(() => hasImage(page, type)).toBe(true);
  }
});

// PIN-03: a Pin comes and goes with the Map date.
test('the Pins row counts the Pins that are true on the Map date', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1850');
  await expect(caption(page)).toHaveText(new RegExp(`of ${SEEDED} true`));
  await expect(caption(page)).not.toHaveText(
    `0 of ${SEEDED} true on this date`
  );
  await goTo(page, '2020');
  await expect(caption(page)).toHaveText(`0 of ${SEEDED} true on this date`);
  await expect.poll(async () => (await shownTypes(page)).length).toBe(0);
});

// MAP-02, PIN-03
test('switching the Pins row off hides every Pin, and on shows them again', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1850');
  await expect
    .poll(async () => (await shownTypes(page)).length)
    .toBeGreaterThan(0);

  const row = page.getByRole('checkbox', { name: 'Pins' });

  await row.uncheck();
  await expect.poll(async () => (await shownTypes(page)).length).toBe(0);
  await row.check();
  await expect
    .poll(async () => (await shownTypes(page)).length)
    .toBeGreaterThan(0);
});

// NFR-01: 10,000 Pins, 20 steps of the Map date by a day, each redraw under 2500 ms (software WebGL on CI).
test(
  'each redraw with 10,000 Pins stays under 2500 ms and asks for the Pins once',
  { tag: '@perf' },
  async ({ page }) => {
    const pinRequests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/data/pins')) {
        pinRequests.push(request.url());
      }
    });
    await page.goto('/');
    await page.getByRole('radio', { name: 'Day' }).click();
    await goTo(page, '1850-01-01');
    await expect
      .poll(async () => (await shownTypes(page)).length)
      .toBeGreaterThan(0);

    const input = page.getByRole('slider', { name: 'Map date' });
    const start = Number(await input.inputValue());
    const times: number[] = [];

    for (let step = 1; step <= 20; step++) {
      await input.fill(String(start + step));
      await page.waitForFunction(
        count =>
          performance.getEntriesByName('map-date-redraw').length >= count,
        times.length + 1
      );
      times.push(
        await page.evaluate(
          () => performance.getEntriesByName('map-date-redraw').at(-1)!.duration
        )
      );
    }

    console.log('redraw ms', times.map(t => Math.round(t)).join(' '));
    expect(Math.max(...times)).toBeLessThan(2500);
    expect(pinRequests).toHaveLength(1);
  }
);
