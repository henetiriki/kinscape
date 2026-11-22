import type { Page } from '@playwright/test';

import { expect, test } from '@playwright/test';

import type { TestWindow } from '@ks/e2e/types';

import { EVENT_TYPES } from '@ks/lib/domain/pins/schemas.mts';

// The seed (scripts/seed-ci.mts) adds 9,995 Pins to the SYNTHETIC Tree of the Postgres that the
// CI `e2e` job uses. The memory adapters hold none, so playwright.config.ts leaves this file out
// there.

const SEEDED = 9_995;
// The save test of pin-form.spec.ts adds one Pin to the same Tree, so a count reads one more once it ran.
const ALL = `(?:${SEEDED}|${SEEDED + 1})`;

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

// The tests use 1950: borders are mapped then, so no notice card covers the map.
// PIN-03
test('draws the Pins of the Map date, each with the glyph of its event type', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1950');
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
  await goTo(page, '1950');
  await expect(caption(page)).toHaveText(new RegExp(`of ${ALL} true`));
  await expect(caption(page)).not.toHaveText(
    new RegExp(`^0 of ${ALL} true on this date$`)
  );
  await goTo(page, '2020');
  await expect(caption(page)).toHaveText(
    new RegExp(`^0 of ${ALL} true on this date$`)
  );
  await expect.poll(async () => (await shownTypes(page)).length).toBe(0);
});

// MAP-02, PIN-03
test('switching the Pins row off hides every Pin, and on shows them again', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1950');
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
      const x = left + point.x;
      const y = top + point.y;
      // A count marker, its fan or a card over the Pin would take the click instead.
      const covered =
        !document
          .elementFromPoint(x, y)
          ?.classList.contains('maplibregl-canvas') ||
        [...document.querySelectorAll('.maplibregl-marker')].some(marker => {
          const box = marker.getBoundingClientRect();

          return (
            x > box.left - 24 &&
            x < box.right + 24 &&
            y > box.top - 24 &&
            y < box.bottom + 24
          );
        });

      if (
        !covered &&
        point.x > window.innerWidth / 2 &&
        point.x < window.innerWidth - 60 &&
        point.y > 160 &&
        point.y < window.innerHeight - 300 &&
        top1
      ) {
        return { id: top1.properties.id, x, y };
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

/**
 * A point on the empty map, at least `away` px from `from`. The map canvas is the top element there,
 * so no count marker, fan, popup or card covers it, and no Pin symbol is within 24 px.
 */
const emptyPoint = (page: Page, from: { x: number; y: number }, away = 60) =>
  page.evaluate(
    ({ away: distance, from: wanted }) => {
      const { kinscapeMap: map } = window as unknown as TestWindow;
      const { left, top } = map.getContainer().getBoundingClientRect();

      for (let y = 100; y < window.innerHeight - 100; y += 20) {
        for (let x = 20; x < window.innerWidth - 20; x += 20) {
          const onCanvas = document
            .elementFromPoint(x, y)
            ?.classList.contains('maplibregl-canvas');
          const near = map.queryRenderedFeatures(
            [
              [x - left - 24, y - top - 24],
              [x - left + 24, y - top + 24],
            ],
            { layers: ['pins'] }
          );

          if (
            onCanvas &&
            near.length === 0 &&
            Math.hypot(x - wanted.x, y - wanted.y) >= distance
          ) {
            return { x, y };
          }
        }
      }

      throw new Error('No empty point on the map');
    },
    { away, from }
  );

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
  await goTo(page, '1950');

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
  await goTo(page, '1950');

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
  await goTo(page, '1950');

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
  const empty = await emptyPoint(page, pin);

  await page.mouse.click(empty.x, empty.y);
  await expect(popup(page)).toBeHidden();
});

// PIN-02, MAP-02: the Pins row hides the Pin, so the popup closes.
test('switching the Pins row off closes the popup', async ({ page }) => {
  await page.goto('/');
  await goTo(page, '1950');

  const pin = await pickPin(page);

  await page.mouse.click(pin.x, pin.y);
  await expect(popup(page)).toBeVisible();
  await page.getByRole('checkbox', { name: 'Pins' }).uncheck();
  await expect(popup(page)).toBeHidden();
});

// PIN-02: the Map date hides the Pin, so the popup closes.
test('a Map date that hides the Pin closes its popup', async ({ page }) => {
  await page.goto('/');
  await goTo(page, '1950');

  const pin = await pickPin(page);

  await page.mouse.click(pin.x, pin.y);
  await expect(popup(page)).toBeVisible();
  await goTo(page, '2020');
  await expect(popup(page)).toBeHidden();
});

/**
 * A count marker in the free area: its centre on the page and its count. The seed puts 20 Pins on
 * each Place, so some Places show two or more on a Map date.
 */
const pickMarker = async (page: Page) => {
  await expect(page.locator('.maplibregl-marker').first()).toBeAttached();

  return page.evaluate(() => {
    for (const marker of document.querySelectorAll('.maplibregl-marker')) {
      const { height, left, top, width } = marker.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;

      if (
        x > window.innerWidth / 2 &&
        x < window.innerWidth - 160 &&
        y > 200 &&
        y < window.innerHeight - 340
      ) {
        return { count: Number(marker.textContent), x, y };
      }
    }

    throw new Error('No count marker is in the free area');
  });
};

/** The Pins of the open fan. */
const fanPins = (page: Page) =>
  page.locator('.maplibregl-marker button:not([aria-label$=" Pins"])');

// PIN-06: one marker with the count; hover fans the Pins out and leaving folds them.
test('a count marker fans its Pins out on hover and folds them when the pointer leaves', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1950');

  const marker = await pickMarker(page);

  expect(marker.count).toBeGreaterThan(1);
  await expect(
    page.getByRole('button', { name: `${marker.count} Pins` }).first()
  ).toBeVisible();
  await page.mouse.move(marker.x, marker.y);
  await expect(fanPins(page)).toHaveCount(marker.count);

  // #863 D6: the event type and the date reading of the popup.
  for (const name of await fanPins(page).evaluateAll(pins =>
    pins.map(pin => pin.getAttribute('aria-label'))
  )) {
    expect(name).toMatch(
      /^[A-Z][a-z]+, (in|on|from|about|before|after|between|calculated as|estimated as) /
    );
  }

  const away = await emptyPoint(page, marker, 200);

  await page.mouse.move(away.x, away.y);
  await expect(fanPins(page)).toHaveCount(0);
});

// PIN-02, #863 D4: a fan Pin opens its popup; the marker shows the ring until the popup closes.
test('a fan Pin opens its popup, and its marker shows the ring until the popup closes', async ({
  page,
}) => {
  await page.goto('/');
  await goTo(page, '1950');

  const marker = await pickMarker(page);

  await page.mouse.move(marker.x, marker.y);
  await fanPins(page).first().click();
  await expect(popup(page)).toBeVisible();
  await expect(fanPins(page)).toHaveCount(0);
  await expect(page.locator('.maplibregl-marker [data-ring]')).toHaveCount(1);

  await popup(page).getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.maplibregl-marker [data-ring]')).toHaveCount(0);
});

// NFR-05: a tap is a map `click`; the sheet has no "Add a pin here".
test.describe('on a phone', () => {
  test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });

  test('a tap on a Pin opens the details in the date sheet, with no "Add a pin here"', async ({
    page,
  }) => {
    await page.goto('/');
    await goTo(page, '1950');

    const pin = await pickPin(page);

    await page.touchscreen.tap(pin.x, pin.y);
    await expect(popup(page).getByRole('heading', { level: 3 })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add a pin here' })
    ).toHaveCount(0);
  });

  // PIN-06: the first tap fans the Pins out, a tap elsewhere folds them, and a tap on a Pin opens it.
  test('a tap fans a count marker out, a tap elsewhere folds it, and a tap on a Pin opens it', async ({
    page,
  }) => {
    await page.goto('/');
    await goTo(page, '1950');

    const pickPhoneMarker = () =>
      page.evaluate(() => {
        for (const marker of document.querySelectorAll('.maplibregl-marker')) {
          const { height, left, top, width } = marker.getBoundingClientRect();
          const x = left + width / 2;
          const y = top + height / 2;

          if (x > 120 && x < window.innerWidth - 120 && y > 220 && y < 420) {
            return { x, y };
          }
        }

        throw new Error('No count marker is in the free area');
      });

    await expect(page.locator('.maplibregl-marker').first()).toBeAttached();

    const marker = await pickPhoneMarker();

    await page.touchscreen.tap(marker.x, marker.y);
    await expect(fanPins(page).first()).toBeVisible();
    const away = await emptyPoint(page, marker, 120);

    await page.touchscreen.tap(away.x, away.y);
    await expect(fanPins(page)).toHaveCount(0);

    await page.touchscreen.tap(marker.x, marker.y);

    const pin = (await fanPins(page).first().boundingBox())!;

    await page.touchscreen.tap(pin.x + pin.width / 2, pin.y + pin.height / 2);
    await expect(popup(page).getByRole('heading', { level: 3 })).toBeVisible();
    await expect(fanPins(page)).toHaveCount(0);
  });
});

// NFR-01: about 10,000 Pins, 20 steps of the Map date by a day, each redraw under 2500 ms (software WebGL on CI).
test(
  'each redraw with about 10,000 Pins stays under 2500 ms and asks for the Pins once',
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
    await goTo(page, '1950-01-01');
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
