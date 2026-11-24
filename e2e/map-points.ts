import type { Locator, Page } from '@playwright/test';

import { expect } from '@playwright/test';

import type { TestWindow } from '@ks/e2e/types';

/** The click popup of a click on empty map. */
export const clickPopup = (page: Page) =>
  page.getByRole('dialog', { name: 'Add a pin here' });

/** The coordinates field of the "Add a pin" panel. */
export const coordinates = (page: Page) => page.getByLabel('Coordinates');

/**
 * The whole pixels from the bottom of the Precision box of a form to the top of another element.
 * The label alone names the map filter too, so the form scopes it.
 */
export const gapBelowPrecision = async (form: Locator, next: Locator) => {
  const box = (await form
    .getByLabel('Precision', { exact: true })
    .boundingBox())!;
  const below = (await next.boundingBox())!;

  return Math.round(below.y - (box.y + box.height));
};

/** Resolves after two frames, so React has drawn what a click or a tap set off. */
export const afterPaint = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );

/** The event type of each Pin symbol that the map draws now. */
export const shownTypes = async (page: Page) => {
  await page.waitForFunction(() => 'kinscapeMap' in window);

  return page.evaluate(() => {
    const { kinscapeMap } = window as unknown as TestWindow;

    return kinscapeMap
      .queryRenderedFeatures(undefined, { layers: ['pins'] })
      .map(feature => feature.properties.eventType);
  });
};

/** Types the Map date, as the date field takes it. */
export const goTo = async (page: Page, date: string) => {
  const field = page.getByRole('textbox', { name: 'Date shown' });

  await field.fill(date);
  await field.press('Enter');
};

/**
 * A Pin the click picks at its own point, away from the furniture: the page point to click and the
 * id the app reads from the click.
 */
export const pickPin = async (page: Page) => {
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

/** Where the Pin is on the page now, from the map. */
export const pinPoint = (page: Page, id: string) =>
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
export const emptyPoint = (
  page: Page,
  from: { x: number; y: number },
  away = 60
) =>
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
