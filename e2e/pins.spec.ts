import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { TestWindow } from '@ks/e2e/types';

import { EVENT_TYPES } from '@ks/lib/domain/pins/schemas.mts';

// The seed (scripts/seed-ci.mts) adds 10,000 Pins to the SYNTHETIC Tree of the Postgres that the
// CI `e2e` job uses. The memory adapters hold none, so playwright.config.ts leaves this file out
// there.

const SEEDED = 10_000;

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

/**
 * A Pin the click picks at its own point, away from the furniture: the page point to click and the
 * id the app reads from the click.
 */
const pickPin = async (page: Page) => {
  await expect
    .poll(async () => (await shownTypes(page)).length)
    .toBeGreaterThan(0);

  return page.evaluate(() => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { left, top } = map.getContainer().getBoundingClientRect();

    for (const feature of map.queryRenderedFeatures(undefined, {
      layers: ['pins'],
    })) {
      const point = map.project(feature.geometry.coordinates);
      const [top1] = map.queryRenderedFeatures(point, { layers: ['pins'] });

      if (
        point.x > window.innerWidth / 2 &&
        point.x < window.innerWidth - 60 &&
        point.y > 160 &&
        point.y < window.innerHeight - 300 &&
        top1
      ) {
        return { id: top1.properties.id, x: left + point.x, y: top + point.y };
      }
    }

    throw new Error('No Pin is in the free area');
  });
};

const popup = (page: Page) =>
  page.getByRole(page.viewportSize()!.width < 640 ? 'group' : 'dialog', {
    name: 'Pin details',
  });

/** Where the Pin is on the page now, from the map. */
const pinPoint = (page: Page, id: string) =>
  page.evaluate(wanted => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { left, top } = map.getContainer().getBoundingClientRect();
    const feature = map
      .queryRenderedFeatures(undefined, { layers: ['pins'] })
      .find(({ properties }) => properties.id === wanted)!;
    const point = map.project(feature.geometry.coordinates);

    return { x: left + point.x, y: top + point.y };
  }, id);

// PIN-02: no request for the details before a click, then one for that Pin.
test('a click on a Pin opens its popup, and asks for its details once', async ({
  page,
}) => {
  const detailRequests: string[] = [];

  page.on('request', request => {
    if (/\/data\/pins\/[^/]+$/.test(request.url())) {
      detailRequests.push(request.url());
    }
  });
  await page.goto('/');
  await goTo(page, '1850');

  const pin = await pickPin(page);

  expect(detailRequests).toHaveLength(0);
  await page.mouse.click(pin.x, pin.y);
  await expect(popup(page).getByRole('heading', { level: 3 })).toBeVisible();
  await expect(popup(page).getByText('Address as recorded')).toBeVisible();
  await expect(
    popup(page).getByText(/^(From|Between|In|On|About)/)
  ).toBeVisible();
  await expect(
    popup(page).getByRole('button', { name: 'Add a pin here' })
  ).toBeVisible();
  expect(detailRequests).toHaveLength(1);
  expect(detailRequests[0]).toContain(pin.id);
});

// PIN-02: the popup stays at its Pin.
test('the popup stays at its Pin after a pan and after a zoom', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1850');

  const pin = await pickPin(page);

  await page.mouse.click(pin.x, pin.y);
  await expect(popup(page)).toBeVisible();

  // The popup's right edge sits 30 px left of the Pin.
  const gap = async () => {
    const box = (await popup(page).boundingBox())!;
    const now = await pinPoint(page, pin.id);

    return { dx: now.x - (box.x + box.width), now };
  };

  expect((await gap()).dx).toBeCloseTo(30, 0);

  await page.evaluate(() => {
    const { kinscapeMap: map } = window as unknown as TestWindow;
    const { lat, lng } = map.getCenter();

    map.jumpTo({ center: [lng + 0.2, lat - 0.1] });
  });
  await expect.poll(async () => (await gap()).dx).toBeCloseTo(30, 0);
  await page.evaluate(() => {
    const { kinscapeMap: map } = window as unknown as TestWindow;

    map.jumpTo({ zoom: map.getZoom() + 0.5 });
  });
  await expect.poll(async () => (await gap()).dx).toBeCloseTo(30, 0);
});

// PIN-02
test('Close, Esc and a click on empty map close the popup', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1850');

  const pin = await pickPin(page);
  const open = async () => {
    await page.mouse.click(pin.x, pin.y);
    await expect(popup(page)).toBeVisible();
  };

  await open();
  await popup(page).getByRole('button', { name: 'Close' }).click();
  await expect(popup(page)).toBeHidden();
  await open();
  await page.keyboard.press('Escape');
  await expect(popup(page)).toBeHidden();
  await open();
  // The map has no Pin 200 px right of the one that is open, in the free area.
  await page.mouse.click(pin.x - 5, pin.y + 120);
  await expect(popup(page)).toBeHidden();
});

// PIN-02: the Map date hides the Pin, so the popup closes.
test('a Map date that hides the Pin closes its popup', async ({ page }) => {
  await page.goto('/');
  await goTo(page, '1850');

  const pin = await pickPin(page);

  await page.mouse.click(pin.x, pin.y);
  await expect(popup(page)).toBeVisible();
  await goTo(page, '2020');
  await expect(popup(page)).toBeHidden();
});

// NFR-05: a tap is a map `click`; the sheet has no "Add a pin here".
test.describe('on a phone', () => {
  test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });

  test('a tap on a Pin opens the details in the date sheet, with no "Add a pin here"', async ({
    page,
  }) => {
    await page.goto('/');
    await goTo(page, '1850');

    const pin = await pickPin(page);

    await page.touchscreen.tap(pin.x, pin.y);
    await expect(popup(page).getByRole('heading', { level: 3 })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add a pin here' })
    ).toHaveCount(0);
  });
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
    // The map load, the Pins load and `goTo` already made redraw entries. Count only the steps.
    const base = await page.evaluate(
      () => performance.getEntriesByName('map-date-redraw').length
    );
    const times: number[] = [];

    for (let step = 1; step <= 20; step++) {
      await input.fill(String(start + step));
      await page.waitForFunction(
        count =>
          performance.getEntriesByName('map-date-redraw').length >= count,
        base + step
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
